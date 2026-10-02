import{_ as a,o as n,c as i,a4 as e}from"./chunks/framework.YC5CMuPM.js";const k=JSON.parse('{"title":"Console App","description":"","frontmatter":{"title":"Console App","outline":false},"headers":[],"relativePath":"examples/console-app.md","filePath":"examples/console-app.md","lastUpdated":null}'),l={name:"examples/console-app.md"};function t(C,s,p,h,r,o){return n(),i("div",null,[...s[0]||(s[0]=[e(`<h1 id="console-app" tabindex="-1">Console App <a class="header-anchor" href="#console-app" aria-label="Permalink to &quot;Console App&quot;">​</a></h1><p><strong>A command-line program that uses JUCE core classes with no GUI.</strong></p><ul><li>ConsoleApplication setup</li><li>Using juce_core on its own</li></ul><p>Source: <a href="https://github.com/juce-framework/JUCE/tree/master/examples/CMake/ConsoleApp" target="_blank" rel="noreferrer">examples/CMake/ConsoleApp</a> on GitHub.</p><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-Z-0Mb" id="tab-DyP-O9a" checked><label data-title="Main.cpp" for="tab-DyP-O9a">Main.cpp</label><input type="radio" name="group-Z-0Mb" id="tab-zd_IMja"><label data-title="CMakeLists.txt" for="tab-zd_IMja">CMakeLists.txt</label></div><div class="blocks"><div class="language-cpp vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">#include </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&lt;juce_core/juce_core.h&gt;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">int main (int argc, char* argv[])</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // Your code goes here!</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::ignoreUnused (argc, argv);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    return 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span></code></pre></div><div class="language-cmake vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cmake</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># Example Console App CMakeLists.txt</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># To get started on a new console app, copy this entire folder (containing this file and C++</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># sources) to a convenient location, and then start making modifications. For other examples of</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># CMakeLists for console apps, check \`extras/BinaryBuilder\` and \`extras/UnitTestRunner\` in the JUCE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># repo.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># The first line of any CMake project should be a call to \`cmake_minimum_required\`, which checks</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># that the installed CMake will be able to understand the following CMakeLists, and ensures that</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># CMake&#39;s behaviour is compatible with the named version. This is a standard CMake command, so more</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># information can be found in the CMake docs.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">cmake_minimum_required(VERSION 3.22)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># The top-level CMakeLists.txt file for a project must contain a literal, direct call to the</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`project()\` command. \`project()\` sets up some helpful variables that describe source/binary</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># directories, and the current project version. This is a standard CMake command.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">project(CONSOLE_APP_EXAMPLE VERSION 0.0.1)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># If you&#39;ve installed JUCE somehow (via a package manager, or directly using the CMake install</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># target), you&#39;ll need to tell this project that it depends on the installed copy of JUCE. If you&#39;ve</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># included JUCE directly in your source tree (perhaps as a submodule), you&#39;ll need to tell CMake to</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># include that subdirectory as part of the build.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># find_package(JUCE CONFIG REQUIRED)        # If you&#39;ve installed JUCE to your system</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># or</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># add_subdirectory(JUCE)                    # If you&#39;ve put JUCE in a subdirectory called JUCE</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`juce_add_console_app\` adds an executable target with the name passed as the first argument</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># (ConsoleAppExample here). This target is a normal CMake target, but has a lot of extra properties</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># set up by default. This function accepts many optional arguments. Check the readme at</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`docs/CMake API.md\` in the JUCE repo for the full list.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">juce_add_console_app(ConsoleAppExample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    PRODUCT_NAME </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Console App Example&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">      # The name of the final executable, which can differ from the target name</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    NEEDS_WEB_BROWSER FALSE                 </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># Set to TRUE if you need to use webviews</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    NEEDS_CURL FALSE)                       </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># Set to TRUE if you need to use curl</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`juce_generate_juce_header\` will create a JuceHeader.h for a given target, which will be generated</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># into the build tree. This header should be included with \`#include &lt;JuceHeader.h&gt;\`. The include</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># path for this header will be automatically added to the target. The main function of the</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># JuceHeader is to include all the JUCE module headers for a particular target; if you&#39;re happy to</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># include module headers directly, you probably don&#39;t need to call this.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># juce_generate_juce_header(ConsoleAppExample)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`target_sources\` adds source files to a target. We pass the target that needs the sources as the</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># first argument, then a visibility parameter for the sources which should normally be PRIVATE.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># Finally, we supply a list of source files that will be built into the target. This is a standard</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># CMake command.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">target_sources(ConsoleAppExample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    PRIVATE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        Main.cpp)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`target_compile_definitions\` adds some preprocessor definitions to our target. In a Projucer</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># project, these might be passed in the &#39;Preprocessor Definitions&#39; field. JUCE modules also make use</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># of compile definitions to switch certain features on/off, so if there&#39;s a particular feature you</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># need that&#39;s not on by default, check the module header for the correct flag to set here. These</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># definitions will be visible both to your code, and also the JUCE module code, so for new</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># definitions, pick unique names that are unlikely to collide! This is a standard CMake command.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">target_compile_definitions(ConsoleAppExample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    PRIVATE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        # JUCE_WEB_BROWSER and JUCE_USE_CURL would be on by default, but you might not need them.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        JUCE_WEB_BROWSER=0  </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># If you remove this, add \`NEEDS_WEB_BROWSER TRUE\` to the \`juce_add_console_app\` call</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        JUCE_USE_CURL=0)    </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># If you remove this, add \`NEEDS_CURL TRUE\` to the \`juce_add_console_app\` call</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># If the target needs extra binary assets, they can be added here. The first argument is the name of</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># a new static library target that will include all the binary resources. There is an optional</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`NAMESPACE\` argument that can specify the namespace of the generated binary data class. Finally,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># the SOURCES argument should be followed by a list of source files that should be built into the</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># static library. These source files can be of any kind (wav data, images, fonts, icons etc.).</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># Conversion to binary-data will happen when the target is built.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># juce_add_binary_data(ConsoleAppData SOURCES ...)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`target_link_libraries\` links libraries and JUCE modules to other libraries or executables. Here,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># we&#39;re linking our executable target to the \`juce::juce_core\` module. Inter-module dependencies are</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># resolved automatically. If you&#39;d generated a binary data target above, you would need to link to</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># it here too. This is a standard CMake command.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">target_link_libraries(ConsoleAppExample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    PRIVATE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        # ConsoleAppData            # If you&#39;d created a binary data target, you&#39;d link to it here</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::juce_core</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    PUBLIC</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::juce_recommended_config_flags</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::juce_recommended_warning_flags)</span></span></code></pre></div></div></div>`,5)])])}const d=a(l,[["render",t]]);export{k as __pageData,d as default};
