#!/usr/bin/env bash
# Create the project folder described by a tutorial's "Set up the project"
# section, so you do not have to copy and edit the files by hand.
#
# Usage:
#   JUCE_PATH=/path/to/JUCE SOURCE_PROJECT=~/dev/HelloJuce \
#       ./new-project.sh 06-synthesis.md
#
# The script reads the tutorial and, for each file listed under a bold
# filename heading (**`CMakeLists.txt`**, **`MainComponent.h`**, ...), writes the
# code block that follows it into the new project folder. It then:
#   - replaces /path/to/JUCE with JUCE_PATH,
#   - renames the target if PROJECT_NAME differs from the tutorial's name,
#   - copies Main.cpp from SOURCE_PROJECT when the tutorial says it is
#     "copied unchanged" (never copying a build folder).
#
# Environment variables:
#   JUCE_PATH        Where JUCE is installed. Optional if SOURCE_PROJECT has a
#                    CMakeLists.txt, in which case its add_subdirectory path is used.
#   PROJECT_NAME     Name of the new project. Default: the name the tutorial uses.
#   SOURCE_PROJECT   Your finished tutorial 1 project (for example HelloJuce).
#                    Needed only for tutorials that keep Main.cpp.
#   PROJECTS_DIR     Folder to create the project in. Default: current directory.
set -euo pipefail

die() { echo "error: $*" >&2; exit 1; }

[ $# -eq 1 ] || die "usage: $0 <tutorial.md>   (see the comment at the top of this script)"
tutorial=$1
[ -f "$tutorial" ] || die "tutorial not found: $tutorial"

# The tutorial's own project name: the first backticked name after "name the copy"
# or "copy" (tutorials 2 to 14), or after "folder named" (tutorial 8).
tutorial_name=$(tr '\n' ' ' < "$tutorial" \
    | grep -oE '(name the copy|the copy|copy|folder named) `[A-Za-z0-9_]+`' \
    | head -n1 | grep -oE '`[A-Za-z0-9_]+`' | tr -d '`') || true
[ -n "$tutorial_name" ] || die "could not find a project name in $tutorial"

project_name=${PROJECT_NAME:-$tutorial_name}
projects_dir=${PROJECTS_DIR:-.}
dest="$projects_dir/$project_name"
[ ! -e "$dest" ] || die "$dest already exists"

juce_path=${JUCE_PATH:-}
if [ -z "$juce_path" ] && [ -n "${SOURCE_PROJECT:-}" ] && [ -f "$SOURCE_PROJECT/CMakeLists.txt" ]; then
    juce_path=$(sed -nE 's/^[[:space:]]*add_subdirectory\([[:space:]]*"?([^" )]+)"?[[:space:]]+JUCE\).*/\1/p' \
        "$SOURCE_PROJECT/CMakeLists.txt" | head -n1)
fi
[ -n "$juce_path" ] || die "set JUCE_PATH to the folder JUCE is installed in"
[ -f "$juce_path/CMakeLists.txt" ] || die "JUCE_PATH does not look like a JUCE checkout: $juce_path"

mkdir -p "$dest"

# Write each **`file`** heading's following fenced block to $dest/file.
awk -v dest="$dest" '
    match($0, /^\*\*`[A-Za-z0-9_.\/-]+`\*\*[[:space:]]*$/) {
        name = $0; gsub(/^\*\*`|`\*\*[[:space:]]*$/, "", name); want = name; next
    }
    want != "" && /^```/ && !infence { infence = 1; out = dest "/" want; printf "" > out; next }
    infence && /^```/ { close(out); infence = 0; want = ""; next }
    infence { print >> out }
' "$tutorial"

# Main.cpp is not given in the tutorial when it is "copied unchanged".
if grep -qE 'Main\.cpp +# copied unchanged' "$tutorial"; then
    [ -n "${SOURCE_PROJECT:-}" ] || die "$tutorial keeps Main.cpp: set SOURCE_PROJECT to your tutorial 1 project"
    [ -f "$SOURCE_PROJECT/Main.cpp" ] || die "no Main.cpp in $SOURCE_PROJECT"
    cp "$SOURCE_PROJECT/Main.cpp" "$dest/Main.cpp"
fi

cmake_file="$dest/CMakeLists.txt"
[ -f "$cmake_file" ] || die "$tutorial has no CMakeLists.txt block"

# Point at the real JUCE (| is the sed delimiter, so escape it and & in the path).
escaped_path=$(printf '%s' "$juce_path" | sed -e 's/[|&\\]/\\&/g')
sed -i.bak "s|/path/to/JUCE|$escaped_path|" "$cmake_file"

# Rename the target, project() and PRODUCT_NAME if the user chose another name.
if [ "$project_name" != "$tutorial_name" ]; then
    spaced() { printf '%s' "$1" | sed -E 's/([a-z0-9])([A-Z])/\1 \2/g'; }
    upper() { printf '%s' "$1" | tr '[:lower:]' '[:upper:]'; }
    sed -i.bak \
        -e "s/\"$(spaced "$tutorial_name")\"/\"$(spaced "$project_name")\"/g" \
        -e "s/\\b$(upper "$tutorial_name")\\b/$(upper "$project_name")/g" \
        -e "s/\\b$tutorial_name\\b/$project_name/g" \
        "$cmake_file"
fi
rm -f "$cmake_file.bak"

echo "Created $dest from $tutorial:"
(cd "$dest" && ls -1 | sed 's/^/  /')
echo
echo "Build it with:"
echo "  cd $dest && cmake -B build && cmake --build build"
