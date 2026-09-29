# Rendering with OpenGL

Draw hardware-accelerated 3D graphics in a JUCE app with `OpenGLAppComponent` and
shaders.

**Level:** Advanced  
**Platforms:** Windows, macOS, Linux, iOS, Android  
**Module:** link `juce::juce_opengl`. On Linux, JUCE 9 creates OpenGL contexts through
EGL, so install the EGL development package (for example `libegl-dev`). See
[Linux Dependencies](../Linux%20Dependencies.md).

This guide assumes basic familiarity with OpenGL itself. It covers how JUCE
hosts a GL context and the parts of your code that you must write.

## The pieces of a GL application

| Concept            | Meaning                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| Context            | The GL state for a window. JUCE creates and owns it (`openGLContext`).     |
| Projection matrix  | Maps 3D view space onto the 2D screen (perspective via a frustum).         |
| View matrix        | Moves and rotates the scene relative to the camera.                        |
| Vertex             | A point with attributes: position, normal, colour, texture coordinates.    |
| Shader program     | A vertex shader (runs per vertex) plus a fragment shader (runs per pixel), written in GLSL. |
| Attribute          | A per-vertex input to the vertex shader.                                    |
| Uniform            | A value shared by every vertex in a draw call, such as a matrix.            |
| Varying            | A value passed from the vertex shader, interpolated, to the fragment shader.|

## `OpenGLAppComponent`

Like `AudioAppComponent`, `OpenGLAppComponent` is a `Component` with a lifecycle you
override:

| Function       | When                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| `initialise()` | The context is ready: build shaders and buffers.                          |
| `render()`     | Once per frame on the **GL thread**: draw.                                |
| `shutdown()`   | The context is closing: delete every GL object you made.                  |
| `shutdownOpenGL()` | Call from *your destructor* so the renderer stops before your members die. |

`initialise()` and `shutdown()` can run more than once, because the platform may
destroy and re-create the context, so never assume a single call. `getFrameCounter()`
counts rendered frames, which is handy for animation. Everything in `render()`
runs on a different thread from the message thread, so do not touch ordinary
components or shared state from it without protection.

## A rotating triangle

```cpp
#include <juce_opengl/juce_opengl.h>

class GLComponent final : public juce::OpenGLAppComponent
{
public:
    GLComponent()  { setSize (800, 600); }
    ~GLComponent() override { shutdownOpenGL(); }

    void initialise() override
    {
        using namespace ::juce::gl;

        auto newShader = std::make_unique<juce::OpenGLShaderProgram> (openGLContext);

        if (newShader->addVertexShader (juce::OpenGLHelpers::translateVertexShaderToV3 (vertexShader))
            && newShader->addFragmentShader (juce::OpenGLHelpers::translateFragmentShaderToV3 (fragmentShader))
            && newShader->link())
        {
            shader = std::move (newShader);
            shader->use();

            position       = std::make_unique<juce::OpenGLShaderProgram::Attribute> (*shader, "position");
            sourceColour   = std::make_unique<juce::OpenGLShaderProgram::Attribute> (*shader, "sourceColour");
            projectionMatrix = std::make_unique<juce::OpenGLShaderProgram::Uniform>  (*shader, "projectionMatrix");
            viewMatrix       = std::make_unique<juce::OpenGLShaderProgram::Uniform>  (*shader, "viewMatrix");

            const Vertex vertices[] = { { {  0.0f,  0.8f, 0.0f }, { 1.0f, 0.0f, 0.0f, 1.0f } },
                                        { { -0.8f, -0.6f, 0.0f }, { 0.0f, 1.0f, 0.0f, 1.0f } },
                                        { {  0.8f, -0.6f, 0.0f }, { 0.0f, 0.0f, 1.0f, 1.0f } } };

            glGenBuffers (1, &vertexBuffer);
            glBindBuffer (GL_ARRAY_BUFFER, vertexBuffer);
            glBufferData (GL_ARRAY_BUFFER, (GLsizeiptr) sizeof (vertices), vertices, GL_STATIC_DRAW);
        }
        else
        {
            DBG (newShader->getLastError());       // shader compile or link errors land here
        }
    }

    void shutdown() override
    {
        using namespace ::juce::gl;

        if (vertexBuffer != 0)
            glDeleteBuffers (1, &vertexBuffer);

        vertexBuffer = 0;
        position.reset(); sourceColour.reset(); projectionMatrix.reset(); viewMatrix.reset();
        shader.reset();
    }

    void render() override
    {
        using namespace ::juce::gl;

        jassert (juce::OpenGLHelpers::isContextActive());
        if (shader == nullptr) return;

        auto scale = (float) openGLContext.getRenderingScale();         // retina and HiDPI
        juce::OpenGLHelpers::clear (getLookAndFeel().findColour (juce::ResizableWindow::backgroundColourId));

        glEnable (GL_BLEND);
        glBlendFunc (GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
        glViewport (0, 0, juce::roundToInt (scale * (float) getWidth()),
                          juce::roundToInt (scale * (float) getHeight()));

        shader->use();
        projectionMatrix->setMatrix4 (getProjectionMatrix().mat, 1, false);
        viewMatrix->setMatrix4       (getViewMatrix().mat,       1, false);

        glBindBuffer (GL_ARRAY_BUFFER, vertexBuffer);
        glVertexAttribPointer (position->attributeID,     3, GL_FLOAT, GL_FALSE, sizeof (Vertex), nullptr);
        glVertexAttribPointer (sourceColour->attributeID, 4, GL_FLOAT, GL_FALSE, sizeof (Vertex),
                               (GLvoid*) (sizeof (float) * 3));
        glEnableVertexAttribArray (position->attributeID);
        glEnableVertexAttribArray (sourceColour->attributeID);

        glDrawArrays (GL_TRIANGLES, 0, 3);

        glDisableVertexAttribArray (position->attributeID);
        glDisableVertexAttribArray (sourceColour->attributeID);
        glBindBuffer (GL_ARRAY_BUFFER, 0);
    }

    void paint (juce::Graphics&) override {}        // GL draws the content
    void resized() override {}

private:
    struct Vertex { float position[3]; float colour[4]; };

    juce::Matrix3D<float> getProjectionMatrix() const
    {
        auto w = 1.0f / (0.5f + 0.1f);                                        // half-width at the near plane
        auto h = w * getLocalBounds().toFloat().getAspectRatio (false);       // keep the aspect ratio
        return juce::Matrix3D<float>::fromFrustum (-w, w, -h, h, 4.0f, 30.0f);
    }

    juce::Matrix3D<float> getViewMatrix() const
    {
        auto view     = juce::Matrix3D<float>::fromTranslation ({ 0.0f, 0.0f, -10.0f });
        auto rotation = view.rotation ({ 0.0f, 5.0f * std::sin ((float) getFrameCounter() * 0.01f), 0.0f });
        return view * rotation;
    }

    const juce::String vertexShader = R"(
        attribute vec4 position;
        attribute vec4 sourceColour;
        uniform mat4 projectionMatrix;
        uniform mat4 viewMatrix;
        varying vec4 destinationColour;
        void main()
        {
            destinationColour = sourceColour;
            gl_Position = projectionMatrix * viewMatrix * position;
        })";

    const juce::String fragmentShader =
       #if JUCE_OPENGL_ES
        R"(varying lowp vec4 destinationColour;)"
       #else
        R"(varying vec4 destinationColour;)"
       #endif
        R"(
        void main()
        {
            gl_FragColor = destinationColour;
        })";

    std::unique_ptr<juce::OpenGLShaderProgram> shader;
    std::unique_ptr<juce::OpenGLShaderProgram::Attribute> position, sourceColour;
    std::unique_ptr<juce::OpenGLShaderProgram::Uniform> projectionMatrix, viewMatrix;
    juce::uint32 vertexBuffer = 0;
};
```

What to take from it:

- **Write shaders once, translate for the platform.** Write GLSL 1.x-style shaders
  (`attribute`, `varying`, `gl_FragColor`), then pass them through
  `OpenGLHelpers::translateVertexShaderToV3()` and
  `translateFragmentShaderToV3()`, so they also compile on core profiles. OpenGL ES
  needs precision qualifiers (`lowp`) in the fragment shader, as shown.
- **Check every step and read `getLastError()`.** Shader problems otherwise fail
  silently with a black window.
- **Attributes and uniforms can be optimised out** by the GLSL compiler if a
  shader does not use them, and then fail to resolve. Production code checks
  `glGetAttribLocation()` or `glGetUniformLocation()` for a negative result
  before constructing the wrappers, as the demo does.
- **Matrices.** `Matrix3D::fromFrustum (left, right, bottom, top, near, far)`
  builds a perspective projection. Derive the top and bottom from the component's
  aspect ratio so shapes are not stretched. Compose the view matrix from a
  translation and a rotation.
- **Scale for HiDPI.** Multiply component sizes by
  `openGLContext.getRenderingScale()` for `glViewport()`.
- **Index buffers** (`GL_ELEMENT_ARRAY_BUFFER`, `glDrawElements()`) are the way to
  draw meshes without repeating vertices. Store a vertex struct per point (position,
  normal, colour, texture coordinates), fill a `GL_ARRAY_BUFFER`, and describe each
  attribute to GL with the struct size and byte offset. `examples/Assets/WavefrontObjParser.h`
  loads `.obj` meshes, and `examples/GUI/OpenGLAppDemo.h` draws the classic teapot with
  exactly this structure.
- **Delete what you create** (`glDeleteBuffers()`, shader programs) in `shutdown()`.

## Beyond a full-window scene

`OpenGLAppComponent` is a wrapper around `OpenGLContext`. Use the context directly
to accelerate an *existing* component tree, or to add a GL-rendered area to a
larger interface:

```cpp
juce::OpenGLContext context;
context.setRenderer (&myRenderer);       // an OpenGLRenderer with newOpenGLContextCreated(),
                                         // renderOpenGL(), and openGLContextClosing()
context.setContinuousRepainting (true);
context.setComponentPaintingEnabled (true);   // still paint child components on top
context.attachTo (*this);                // must be called after the component is on screen
// ...
context.detach();                        // before the component is destroyed
```

- Attaching a context to a top-level component accelerates all of JUCE's normal 2D
  drawing.
- `setOpenGLVersionRequired()` requests a specific GL version, and
  `setMultisamplingEnabled()` (call before `attachTo()`) enables antialiasing.
- `OpenGLContext::setImageCacheSize()` tunes the memory used for cached 2D images.
  Its argument is in bytes since JUCE 9.0.1.
- Also see `examples/GUI/OpenGLDemo.h` and `OpenGLDemo2D.h` for texture, 2D
  rendering, and shader-editing examples.

## Sources

Condensed from the JUCE tutorial *Build an OpenGL application*, Copyright (c) Raw
Material Software Limited, ISC licence. The triangle example is a new, smaller
program in the same structure as the tutorial's teapot. See
[NOTICE.md](NOTICE.md).
