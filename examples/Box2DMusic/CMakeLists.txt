# Physics Music: a standalone JUCE app that turns Box2D collisions into notes.
#
# Build from the JUCE repository root:
#
#   cmake . -B cmake-build -DJUCE_BUILD_EXAMPLES=ON
#   cmake --build cmake-build --target Box2DMusic
#
# To use it outside the JUCE tree, copy this folder, then add JUCE with add_subdirectory()
# or find_package() before the juce_add_gui_app() call.

cmake_minimum_required(VERSION 3.22)

project(BOX2D_MUSIC VERSION 1.0.0)

juce_add_gui_app(Box2DMusic
    PRODUCT_NAME "Physics Music"
    NEEDS_WEB_BROWSER FALSE
    NEEDS_CURL FALSE)

target_sources(Box2DMusic
    PRIVATE
        Main.cpp
        MainComponent.cpp
        PhysicsMusicWorld.cpp)

target_compile_definitions(Box2DMusic
    PRIVATE
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:Box2DMusic,JUCE_PRODUCT_NAME>"
        JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:Box2DMusic,JUCE_VERSION>")

target_link_libraries(Box2DMusic
    PRIVATE
        juce::juce_audio_utils
        juce::juce_box2d
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags)
