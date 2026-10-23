# jank + JUCE proof of concept.
#
# Builds a shared library exposing a small slice of JUCE behind a JUCE-free header, and generates a
# script that runs the jank example with the matching include/library flags. See README.md.

cmake_minimum_required(VERSION 3.22)

project(JANK_JUCE_EXAMPLE VERSION 0.0.1 LANGUAGES C CXX)

# Allow building from this folder directly, or from a JUCE-including parent project.
if(NOT TARGET juce::juce_core)
    add_subdirectory(${CMAKE_CURRENT_LIST_DIR}/../.. JUCE)
endif()

add_library(jank_juce_bridge SHARED bridge/JuceJankBridge.cpp)

target_include_directories(jank_juce_bridge PUBLIC ${CMAKE_CURRENT_LIST_DIR}/bridge)

target_compile_definitions(jank_juce_bridge PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_STANDALONE_APPLICATION=1)

target_link_libraries(jank_juce_bridge
    PRIVATE
        juce::juce_core
        juce::juce_audio_basics
        juce::juce_recommended_config_flags
        juce::juce_recommended_warning_flags)

# jank loads the library at JIT time, so it must be position independent and export its symbols.
set_target_properties(jank_juce_bridge PROPERTIES
    POSITION_INDEPENDENT_CODE ON
    CXX_VISIBILITY_PRESET default
    VISIBILITY_INLINES_HIDDEN OFF)

# Generate a launcher with the flags jank needs: -I for the bridge header, -L/-l for the library.
set(JANK_EXECUTABLE "jank" CACHE STRING "Path to the jank executable")

file(GENERATE OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/run-juce-hello.sh CONTENT
"#!/bin/sh
exec \"${JANK_EXECUTABLE}\" \\
    -I \"$<TARGET_PROPERTY:jank_juce_bridge,INTERFACE_INCLUDE_DIRECTORIES>\" \\
    -L \"$<TARGET_FILE_DIR:jank_juce_bridge>\" \\
    -l jank_juce_bridge \\
    --module-path \"${CMAKE_CURRENT_LIST_DIR}/src\" \\
    run-main juce-hello \"$@\"
"
    FILE_PERMISSIONS OWNER_READ OWNER_WRITE OWNER_EXECUTE GROUP_READ WORLD_READ)
