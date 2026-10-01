# Two JUCE apps built on Box2D v3, fetched with CMake's FetchContent:
#
#   MusicV3  the Box2DMusic example ported to Box2D v3's hit and sensor events
#   Modal    a modal-synthesis engine: objects ring like wood, glass, metal and stone
#
# This is a standalone CMake project. Configure it directly (it adds JUCE from the
# repository it lives in, and downloads Box2D, so it needs network access the first time):
#
#   cmake -S examples/Box2DAudioV3 -B build-box2d-v3
#   cmake --build build-box2d-v3 --target MusicV3
#   cmake --build build-box2d-v3 --target Modal
#
# To use a JUCE checkout elsewhere:     -DBOX2D_AUDIO_JUCE_DIR=/path/to/JUCE
# To use a local Box2D checkout:        -DFETCHCONTENT_SOURCE_DIR_BOX2D=/path/to/box2d

cmake_minimum_required(VERSION 3.22)

project(BOX2D_AUDIO_V3 VERSION 1.0.0 LANGUAGES C CXX)

set(BOX2D_AUDIO_JUCE_DIR "${CMAKE_CURRENT_LIST_DIR}/../.." CACHE PATH "Path to the JUCE repository")

if(NOT TARGET juce::juce_core)
    add_subdirectory("${BOX2D_AUDIO_JUCE_DIR}" JUCE)
endif()

# Box2D v3 is a C library with a C API. Its own CMake project skips samples and tests
# when it is not the top-level project, so this only builds the library.
include(FetchContent)

FetchContent_Declare(box2d
    GIT_REPOSITORY https://github.com/erincatto/box2d.git
    GIT_TAG        v3.1.1
    GIT_SHALLOW    TRUE)

FetchContent_MakeAvailable(box2d)

function(add_box2d_audio_app target productName)
    juce_add_gui_app(${target}
        PRODUCT_NAME "${productName}"
        NEEDS_WEB_BROWSER FALSE
        NEEDS_CURL FALSE)

    target_sources(${target} PRIVATE ${ARGN})

    target_compile_definitions(${target}
        PRIVATE
            JUCE_WEB_BROWSER=0
            JUCE_USE_CURL=0
            JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:${target},JUCE_PRODUCT_NAME>"
            JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:${target},JUCE_VERSION>")

    # Box2D's public headers trip JUCE's strict warning flags (for example -Wfloat-equal).
    # Marking their directory as a system include silences warnings from them only.
    target_include_directories(${target} SYSTEM PRIVATE "${box2d_SOURCE_DIR}/include")

    target_link_libraries(${target}
        PRIVATE
            box2d
            juce::juce_audio_utils
            juce::juce_gui_extra
        PUBLIC
            juce::juce_recommended_config_flags
            juce::juce_recommended_lto_flags
            juce::juce_recommended_warning_flags)
endfunction()

add_box2d_audio_app(MusicV3 "Physics Music (Box2D v3)"
    MusicV3/Main.cpp
    MusicV3/MainComponent.cpp
    MusicV3/PhysicsMusicWorld.cpp)

add_box2d_audio_app(Modal "Modal Physics"
    Modal/Main.cpp
    Modal/MainComponent.cpp
    Modal/PhysicsWorld.cpp)
