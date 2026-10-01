import{_ as a,o as e,c as n,a4 as i}from"./chunks/framework.YC5CMuPM.js";const c=JSON.parse('{"title":"Rendering with OpenGL","description":"","frontmatter":{},"headers":[],"relativePath":"tutorials/13-opengl.md","filePath":"tutorials/13-opengl.md","lastUpdated":null}'),t={name:"tutorials/13-opengl.md"};function l(C,s,p,r,o,h){return e(),n("div",null,[...s[0]||(s[0]=[i(`<h1 id="rendering-with-opengl" tabindex="-1">Rendering with OpenGL <a class="header-anchor" href="#rendering-with-opengl" aria-label="Permalink to &quot;Rendering with OpenGL&quot;">​</a></h1><p><strong>Draw hardware-accelerated 3D graphics in a JUCE app with <code>OpenGLAppComponent</code> and shaders.</strong></p><p><strong>Level:</strong> Advanced<br><strong>Platforms:</strong> Windows, macOS, Linux, iOS, Android<br><strong>Module:</strong> link <code>juce::juce_opengl</code>. On Linux, JUCE 9 creates OpenGL contexts through EGL, so install the EGL development package (for example <code>libegl-dev</code>). See <a href="https://github.com/juce-framework/JUCE/blob/master/docs/Linux%20Dependencies.md" target="_blank" rel="noreferrer">Linux Dependencies</a>.</p><p>This guide assumes basic familiarity with OpenGL itself. It covers how JUCE hosts a GL context and the parts of your code that you must write.</p><h2 id="the-pieces-of-a-gl-application" tabindex="-1">The pieces of a GL application <a class="header-anchor" href="#the-pieces-of-a-gl-application" aria-label="Permalink to &quot;The pieces of a GL application&quot;">​</a></h2><table tabindex="0"><thead><tr><th>Concept</th><th>Meaning</th></tr></thead><tbody><tr><td>Context</td><td>The GL state for a window. JUCE creates and owns it (<code>openGLContext</code>).</td></tr><tr><td>Projection matrix</td><td>Maps 3D view space onto the 2D screen (perspective via a frustum).</td></tr><tr><td>View matrix</td><td>Moves and rotates the scene relative to the camera.</td></tr><tr><td>Vertex</td><td>A point with attributes: position, normal, colour, texture coordinates.</td></tr><tr><td>Shader program</td><td>A vertex shader (runs per vertex) plus a fragment shader (runs per pixel), written in GLSL.</td></tr><tr><td>Attribute</td><td>A per-vertex input to the vertex shader.</td></tr><tr><td>Uniform</td><td>A value shared by every vertex in a draw call, such as a matrix.</td></tr><tr><td>Varying</td><td>A value passed from the vertex shader, interpolated, to the fragment shader.</td></tr></tbody></table><h2 id="openglappcomponent" tabindex="-1"><code>OpenGLAppComponent</code> <a class="header-anchor" href="#openglappcomponent" aria-label="Permalink to &quot;\`OpenGLAppComponent\`&quot;">​</a></h2><p>Like <code>AudioAppComponent</code>, <code>OpenGLAppComponent</code> is a <code>Component</code> with a lifecycle you override:</p><table tabindex="0"><thead><tr><th>Function</th><th>When</th></tr></thead><tbody><tr><td><code>initialise()</code></td><td>The context is ready: build shaders and buffers.</td></tr><tr><td><code>render()</code></td><td>Once per frame on the <strong>GL thread</strong>: draw.</td></tr><tr><td><code>shutdown()</code></td><td>The context is closing: delete every GL object you made.</td></tr><tr><td><code>shutdownOpenGL()</code></td><td>Call from <em>your destructor</em> so the renderer stops before your members die.</td></tr></tbody></table><p><code>initialise()</code> and <code>shutdown()</code> can run more than once, because the platform may destroy and re-create the context, so never assume a single call. <code>getFrameCounter()</code> counts rendered frames, which is handy for animation. Everything in <code>render()</code> runs on a different thread from the message thread, so do not touch ordinary components or shared state from it without protection.</p><h2 id="a-rotating-triangle" tabindex="-1">A rotating triangle <a class="header-anchor" href="#a-rotating-triangle" aria-label="Permalink to &quot;A rotating triangle&quot;">​</a></h2><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">#include </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&lt;juce_opengl/juce_opengl.h&gt;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class GLComponent final : public juce::OpenGLAppComponent</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    GLComponent()  { setSize (800, 600); }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ~GLComponent() override { shutdownOpenGL(); }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void initialise() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        using namespace ::juce::gl;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto newShader = std::make_unique&lt;juce::OpenGLShaderProgram&gt; (openGLContext);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (newShader-&gt;addVertexShader (juce::OpenGLHelpers::translateVertexShaderToV3 (vertexShader))</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            &amp;&amp; newShader-&gt;addFragmentShader (juce::OpenGLHelpers::translateFragmentShaderToV3 (fragmentShader))</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            &amp;&amp; newShader-&gt;link())</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            shader = std::move (newShader);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            shader-&gt;use();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            position       = std::make_unique&lt;juce::OpenGLShaderProgram::Attribute&gt; (*shader, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;position&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            sourceColour   = std::make_unique&lt;juce::OpenGLShaderProgram::Attribute&gt; (*shader, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;sourceColour&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            projectionMatrix = std::make_unique&lt;juce::OpenGLShaderProgram::Uniform&gt;  (*shader, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;projectionMatrix&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            viewMatrix       = std::make_unique&lt;juce::OpenGLShaderProgram::Uniform&gt;  (*shader, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;viewMatrix&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            const Vertex vertices[] = { { {  0.0f,  0.8f, 0.0f }, { 1.0f, 0.0f, 0.0f, 1.0f } },</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                        { { -0.8f, -0.6f, 0.0f }, { 0.0f, 1.0f, 0.0f, 1.0f } },</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                        { {  0.8f, -0.6f, 0.0f }, { 0.0f, 0.0f, 1.0f, 1.0f } } };</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            glGenBuffers (1, &amp;vertexBuffer);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            glBindBuffer (GL_ARRAY_BUFFER, vertexBuffer);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            glBufferData (GL_ARRAY_BUFFER, (GLsizeiptr) sizeof (vertices), vertices, GL_STATIC_DRAW);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        else</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            DBG (newShader-&gt;getLastError());</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       // shader compile or link errors land here</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void shutdown() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        using namespace ::juce::gl;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (vertexBuffer != 0)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            glDeleteBuffers (1, &amp;vertexBuffer);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        vertexBuffer = 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        position.reset(); sourceColour.reset(); projectionMatrix.reset(); viewMatrix.reset();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        shader.reset();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void render() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        using namespace ::juce::gl;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        jassert (juce::OpenGLHelpers::isContextActive());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (shader == nullptr) return;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto scale = (float) openGLContext.getRenderingScale();</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">         // retina and HiDPI</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::OpenGLHelpers::clear (getLookAndFeel().findColour (juce::ResizableWindow::backgroundColourId));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glEnable (GL_BLEND);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glBlendFunc (GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glViewport (0, 0, juce::roundToInt (scale * (float) getWidth()),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                          juce::roundToInt (scale * (float) getHeight()));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        shader-&gt;use();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        projectionMatrix-&gt;setMatrix4 (getProjectionMatrix().mat, 1, false);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        viewMatrix-&gt;setMatrix4       (getViewMatrix().mat,       1, false);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glBindBuffer (GL_ARRAY_BUFFER, vertexBuffer);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glVertexAttribPointer (position-&gt;attributeID,     3, GL_FLOAT, GL_FALSE, sizeof (Vertex), nullptr);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glVertexAttribPointer (sourceColour-&gt;attributeID, 4, GL_FLOAT, GL_FALSE, sizeof (Vertex),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                               (GLvoid*) (sizeof (float) * 3));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glEnableVertexAttribArray (position-&gt;attributeID);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glEnableVertexAttribArray (sourceColour-&gt;attributeID);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glDrawArrays (GL_TRIANGLES, 0, 3);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glDisableVertexAttribArray (position-&gt;attributeID);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glDisableVertexAttribArray (sourceColour-&gt;attributeID);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        glBindBuffer (GL_ARRAY_BUFFER, 0);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void paint (juce::Graphics&amp;) override {}</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // GL draws the content</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void resized() override {}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    struct Vertex { float position[3]; float colour[4]; };</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::Matrix3D&lt;float&gt; getProjectionMatrix() const</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto w = 1.0f / (0.5f + 0.1f);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                        // half-width at the near plane</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto h = w * getLocalBounds().toFloat().getAspectRatio (false);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       // keep the aspect ratio</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        return juce::Matrix3D&lt;float&gt;::fromFrustum (-w, w, -h, h, 4.0f, 30.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::Matrix3D&lt;float&gt; getViewMatrix() const</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto view     = juce::Matrix3D&lt;float&gt;::fromTranslation ({ 0.0f, 0.0f, -10.0f });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto rotation = view.rotation ({ 0.0f, 5.0f * std::sin ((float) getFrameCounter() * 0.01f), 0.0f });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        return view * rotation;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const juce::String vertexShader = </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">R&quot;(</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        attribute vec4 position;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        attribute vec4 sourceColour;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        uniform mat4 projectionMatrix;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        uniform mat4 viewMatrix;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        varying vec4 destinationColour;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        void main()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            destinationColour = sourceColour;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            gl_Position = projectionMatrix * viewMatrix * position;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        })&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const juce::String fragmentShader =</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       #if JUCE_OPENGL_ES</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        R&quot;(varying lowp vec4 destinationColour;)&quot;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       #else</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        R&quot;(varying vec4 destinationColour;)&quot;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       #endif</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        R&quot;(</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        void main()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            gl_FragColor = destinationColour;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        })&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    std::unique_ptr&lt;juce::OpenGLShaderProgram&gt; shader;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    std::unique_ptr&lt;juce::OpenGLShaderProgram::Attribute&gt; position, sourceColour;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    std::unique_ptr&lt;juce::OpenGLShaderProgram::Uniform&gt; projectionMatrix, viewMatrix;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::uint32 vertexBuffer = 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><p>What to take from it:</p><ul><li><strong>Write shaders once, translate for the platform.</strong> Write GLSL 1.x-style shaders (<code>attribute</code>, <code>varying</code>, <code>gl_FragColor</code>), then pass them through <code>OpenGLHelpers::translateVertexShaderToV3()</code> and <code>translateFragmentShaderToV3()</code>, so they also compile on core profiles. OpenGL ES needs precision qualifiers (<code>lowp</code>) in the fragment shader, as shown.</li><li><strong>Check every step and read <code>getLastError()</code>.</strong> Shader problems otherwise fail silently with a black window.</li><li><strong>Attributes and uniforms can be optimised out</strong> by the GLSL compiler if a shader does not use them, and then fail to resolve. Production code checks <code>glGetAttribLocation()</code> or <code>glGetUniformLocation()</code> for a negative result before constructing the wrappers, as the demo does.</li><li><strong>Matrices.</strong> <code>Matrix3D::fromFrustum (left, right, bottom, top, near, far)</code> builds a perspective projection. Derive the top and bottom from the component&#39;s aspect ratio so shapes are not stretched. Compose the view matrix from a translation and a rotation.</li><li><strong>Scale for HiDPI.</strong> Multiply component sizes by <code>openGLContext.getRenderingScale()</code> for <code>glViewport()</code>.</li><li><strong>Index buffers</strong> (<code>GL_ELEMENT_ARRAY_BUFFER</code>, <code>glDrawElements()</code>) are the way to draw meshes without repeating vertices. Store a vertex struct per point (position, normal, colour, texture coordinates), fill a <code>GL_ARRAY_BUFFER</code>, and describe each attribute to GL with the struct size and byte offset. <code>examples/Assets/WavefrontObjParser.h</code> loads <code>.obj</code> meshes, and <code>examples/GUI/OpenGLAppDemo.h</code> draws the classic teapot with exactly this structure.</li><li><strong>Delete what you create</strong> (<code>glDeleteBuffers()</code>, shader programs) in <code>shutdown()</code>.</li></ul><h2 id="beyond-a-full-window-scene" tabindex="-1">Beyond a full-window scene <a class="header-anchor" href="#beyond-a-full-window-scene" aria-label="Permalink to &quot;Beyond a full-window scene&quot;">​</a></h2><p><code>OpenGLAppComponent</code> is a wrapper around <code>OpenGLContext</code>. Use the context directly to accelerate an <em>existing</em> component tree, or to add a GL-rendered area to a larger interface:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">juce::OpenGLContext context;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">context.setRenderer (&amp;myRenderer);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       // an OpenGLRenderer with newOpenGLContextCreated(),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                         // renderOpenGL(), and openGLContextClosing()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">context.setContinuousRepainting (true);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">context.setComponentPaintingEnabled (true);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // still paint child components on top</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">context.attachTo (*this);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                // must be called after the component is on screen</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">// ...</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">context.detach();</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                        // before the component is destroyed</span></span></code></pre></div><ul><li>Attaching a context to a top-level component accelerates all of JUCE&#39;s normal 2D drawing.</li><li><code>setOpenGLVersionRequired()</code> requests a specific GL version, and <code>setMultisamplingEnabled()</code> (call before <code>attachTo()</code>) enables antialiasing.</li><li><code>OpenGLContext::setImageCacheSize()</code> tunes the memory used for cached 2D images. Its argument is in bytes since JUCE 9.0.1.</li><li>Also see <code>examples/GUI/OpenGLDemo.h</code> and <code>OpenGLDemo2D.h</code> for texture, 2D rendering, and shader-editing examples.</li></ul><h2 id="sources" tabindex="-1">Sources <a class="header-anchor" href="#sources" aria-label="Permalink to &quot;Sources&quot;">​</a></h2><p>Condensed from the JUCE tutorial <em>Build an OpenGL application</em>, Copyright (c) Raw Material Software Limited, ISC licence. The triangle example is a new, smaller program in the same structure as the tutorial&#39;s teapot. See <a href="./notice.html">the attribution notice</a>.</p>`,20)])])}const k=a(t,[["render",l]]);export{c as __pageData,k as default};
