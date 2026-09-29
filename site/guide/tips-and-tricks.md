# Tips and tricks

**Practical lessons from working JUCE developers, collected from a community forum thread and the blog post it discusses.[^thread] They cover debugging, GUI performance, plug-in formats, and build settings.**

These notes are paraphrased and grouped by topic. They come from community experience, not from the JUCE team, so check anything that matters against the headers and your own host and platform. The thread continues to grow, so read it for more.

## Debugging and testing

- **Log to a file.** Plug-ins run inside hosts where a console is often unavailable. Write diagnostics to disk with `FileLogger` from `juce_core`, or with a logging library such as `spdlog`.[^thread]
- **Validate with `pluginval`.** Run it regularly, and add it to continuous integration so a broken plug-in fails the build.[^thread]
- **Build with AddressSanitizer (ASAN).** It turns many memory-related crashes into reports that point at the cause.[^thread]

## GUI and performance

- **Prefer `VBlankAttachment` to a `Timer` for animation.** It calls you once per display refresh, so repaints line up with frames.[^thread]
- **Avoid `setBufferedToImage()` on a component that has children.** A change in any child invalidates the parent's cached image. Put the content you want cached in a sibling component instead.[^thread]
- **Use `Label` rather than `Graphics::drawText()` for text.** A `Label` is a component, so it takes part in JUCE's accessibility support and is visible to screen readers. Text you paint yourself is not. See the [accessibility notes](https://github.com/andrewh/JUCE/blob/master/docs/Accessibility.md) in the repository.[^thread]

## Talking between processor and editor

- **Send updates asynchronously.** Use listener-style messaging such as `ValueTree::Listener::valueTreePropertyChanged` rather than handing the processor a lambda that captures the editor. The editor can be destroyed while the processor lives on, so a stored lambda can outlive what it captures.[^thread]

## Plug-in formats and hosts

- **Set the version to 0 in debug builds for AU.** Hosts then rescan the Audio Unit on each launch instead of caching an old copy.[^thread]
- **Build and run the app target first for AUv3.** The plug-in extension is packaged inside the app, so the host only sees it once the app has been installed.[^thread]
- **Link the Windows runtime statically.** This avoids depending on a redistributable being installed on the user's machine.[^thread]

## Build and code hygiene

- **Expose the build configuration to your code.** Multi-config generators such as Xcode and Visual Studio choose the configuration at build time, so use a generator expression:[^thread]

  ```cmake
  target_compile_definitions(MyPlugin PRIVATE "BUILD_CONFIG=$<CONFIG>")
  ```

- **Format with `clang-format`.** Automatic formatting keeps diffs small and removes style debates.[^thread]

## Related pages

- [Build systems](./build-systems): CMake, the Projucer, and module flags
- [Anatomy of a plug-in](./plugin-anatomy): processor, editor, and parameters
- [Core concepts](./core-concepts): ownership, listeners, and state

## Sources

[^thread]: ["The big list of JUCE tips and tricks, from n00b to pro"](https://forum.juce.com/t/the-big-list-of-juce-tips-and-tricks-from-n00b-to-pro/62193), JUCE community forum, and the [blog post](https://melatonin.dev/blog/big-list-of-juce-tips-and-tricks/) it links to. Summarised in this site's own words. Individual contributors are not named here, so follow the thread for original credit and further tips.
