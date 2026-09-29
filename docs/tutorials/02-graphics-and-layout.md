# Graphics, layout, and animation

Draw with `Graphics`, build interfaces from nested components, place them with
`Rectangle`, `FlexBox`, and `Grid`, colour and restyle them, and animate them.

**Level:** Beginner to intermediate

## Drawing with `Graphics`

A component draws itself in `paint (juce::Graphics&)`. JUCE calls it when needed;
call `repaint()` to request one, and never call `paint()` yourself. Use the
`Graphics` object only inside `paint()` (or when drawing into an `Image`).
Coordinates are measured from the component's own top-left corner, `(0, 0)`, and
may be `int` or `float`; fractional positions are anti-aliased.

```cpp
void paint (juce::Graphics& g) override
{
    g.fillAll (juce::Colours::lightblue);

    // Text: set the font, then draw into a rectangle
    g.setColour (juce::Colours::darkblue);
    g.setFont (juce::FontOptions ("Times New Roman", 20.0f, juce::Font::italic));
    g.drawText ("Hello, World!", 20, 40, 200, 40, juce::Justification::centred, true);

    // Lines, rectangles, ellipses: draw* outlines, fill* fills
    g.setColour (juce::Colours::green);
    g.drawLine (10, 300, 590, 300, 5.0f);          // x1, y1, x2, y2, thickness

    juce::Rectangle<float> house (300, 120, 200, 170);
    g.fillCheckerBoard (house, 30, 10, juce::Colours::sandybrown, juce::Colours::saddlebrown);

    g.setColour (juce::Colours::yellow);
    g.drawEllipse (530, 10, 60, 60, 3.0f);          // bounding box, not centre

    // Anything else: build a Path
    juce::Path roof;
    roof.addTriangle (300, 110, 500, 110, 400, 70);
    g.setColour (juce::Colours::red);
    g.fillPath (roof);
}
```

- `setColour()` applies to every subsequent drawing call until changed.
- Fonts are described by `juce::FontOptions` (name, height, style). The older
  `Font (name, height, style)` constructors are deprecated. A typeface that is
  not installed silently falls back, which is the usual reason a font looks
  wrong.
- The last argument of `drawText()` enables an ellipsis when the text does not
  fit. For several lines use `drawMultiLineText()` or `drawFittedText()`.
- A line is centred on its coordinates, so a border of thickness `t` drawn on the
  component's edge loses `t / 2` outside the bounds. Inset the shape by half the
  thickness, or call `setPaintingIsUnclipped (true)` (read the caveats first).
- There is no `drawTriangle()` or `drawPolygon()`. Use `Path`, which also
  supports curves, strokes, and transforms.
- `Graphics` can also draw images, gradients, transparency layers, and
  transformed content.

## Nested components

A UI is a tree. Each `Component` may draw itself, contain children, or both.
Each child has exactly one parent at a time.

```cpp
class HouseComponent final : public juce::Component
{
public:
    HouseComponent()
    {
        addAndMakeVisible (wall);   // add as child and show, in one call
        addAndMakeVisible (roof);
    }

    void resized() override
    {
        auto area = getLocalBounds();
        roof.setBounds (area.removeFromTop (area.getHeight() / 5));
        wall.setBounds (area);
    }

private:
    WallComponent wall;
    RoofComponent roof;
};
```

- Child bounds are relative to the parent's top-left corner, so a component can
  be reused anywhere without knowing where it is. Adding a second `HouseComponent`
  to the scene is one member, one `addAndMakeVisible()`, and one `setBounds()`.
- A component paints itself first, then its children in the order they were
  added (change with `toFront()`, `toBack()`, or `toBehind()`). Override
  `paintOverChildren()` to draw on top of children.
- Drawing is clipped to the component's bounds. If a child is invisible, check
  that its bounds were set, normally in the parent's `resized()`.
- A new component has zero size. `setSize()` on the parent triggers `resized()`,
  which is where children get theirs.

## `Point`, `Line`, and `Rectangle`

These templates (usually `<int>` or `<float>`) make geometry readable, in both
`paint()` and `resized()`.

```cpp
juce::Rectangle<int> area (10, 10, 40, 40);               // x, y, w, h
juce::Rectangle<int> fromCorners ({ 10, 10 }, { 50, 50 }); // any two opposite corners
juce::Rectangle<int> sized (10, 10);                       // width and height only

area.setCentre (juce::Point<int> (100, 80));               // position by centre
area.translate (30, 30);   // or: area += juce::Point<int> (30, 30);
bool hit = area.contains (juce::Point<int> (105, 82));
auto overlap = area.getIntersection (fromCorners);

juce::Line<float> a ({ 0, 0 }, { 50, 50 }), b ({ 0, 50 }, { 50, 0 });
juce::Point<float> where;
if (a.intersects (b, where))     // true only if the segments cross
    g.fillEllipse (juce::Rectangle<float> (8, 8).withCentre (where));
```

`Line::getIntersection()` treats the lines as infinite, so it also returns points
outside the segments. Convert between int and float versions with `toFloat()` and
`toNearestInt()`. `Path` takes `Point<float>`.

## Layout by subdividing rectangles

Prefer subdividing `getLocalBounds()` over hard-coded coordinates. Each
`removeFrom*()` call cuts a strip off a `Rectangle` and returns it, leaving the
remainder, so the last item can simply take what is left:

```cpp
void resized() override
{
    auto area = getLocalBounds().reduced (8);

    header.setBounds (area.removeFromTop (40));
    footer.setBounds (area.removeFromBottom (24));
    sidebar.setBounds (area.removeFromLeft (160));

    // Fill the remainder with equal-height rows
    auto rowHeight = area.getHeight() / (int) items.size();
    for (auto* item : items)
        item->setBounds (area.removeFromTop (rowHeight).reduced (2));
}
```

Reordering the strips, changing a size, or adding an item is a one-line edit.
`reduced()` adds padding, and `withTrimmedTop()` and its siblings return a trimmed
copy without changing the original. When you need to lay items out in a grid of
non-uniform cells, subdivide the row first and the row's cells second.

## `FlexBox` and `Grid`

For layouts that must adapt (wrapping rows, proportional columns), describe items
and let JUCE place them. Both are used from `resized()`.

```cpp
juce::FlexBox fb;
fb.flexDirection = juce::FlexBox::Direction::row;
fb.flexWrap      = juce::FlexBox::Wrap::wrap;
fb.justifyContent = juce::FlexBox::JustifyContent::spaceAround;

for (auto* c : controls)
    fb.items.add (juce::FlexItem (*c).withMinWidth (80.0f).withMinHeight (40.0f).withFlex (1.0f));

fb.performLayout (getLocalBounds());
```

```cpp
using Track = juce::Grid::TrackInfo;
using Fr    = juce::Grid::Fr;

juce::Grid grid;
grid.templateRows    = { Track (Fr (1)), Track (Fr (2)) };
grid.templateColumns = { Track (Fr (1)), Track (Fr (1)), Track (Fr (1)) };
grid.items = { juce::GridItem (a), juce::GridItem (b), juce::GridItem (c) };
grid.performLayout (getLocalBounds());
```

Use `FlexBox` for one-dimensional flow and `Grid` for two-dimensional structure.
Both are more declarative than manual `setBounds()` and handle resizing well, but
they cost more setup than a `removeFrom*()` chain for a simple fixed layout.
`Rectangle`-based code is often the shortest option for toolbar-and-panel layouts.

## Colours

`Colour` stores red, green, blue, and alpha.

```cpp
juce::Colours::orange                                   // named constants (HTML colours)
juce::Colours::findColourForName ("DarkRed", juce::Colours::black); // case-insensitive, no inner spaces
juce::Colour (255, 0, 0)                                // 8-bit RGB, opaque
juce::Colour (0xffff0000)                               // ARGB hex: always include the alpha
juce::Colour::fromFloatRGBA (1.0f, 0.0f, 0.0f, 1.0f)
juce::Colour::fromHSV (0.0f, 0.5f, 0.7f, 1.0f)          // hue, saturation, brightness, alpha
```

Derive palettes rather than picking each colour by hand: `brighter()`, `darker()`,
`withAlpha()`, `interpolatedWith (other, 0.5f)`, `contrasting (amount)`,
`Colour::contrasting (a, b)` for a colour clear of two backgrounds, and
`getHue()` to keep a hue while varying brightness. `Colour (0xff...)` without the
leading `ff` is fully transparent.

Built-in widgets expose named colour IDs in enums such as `Label::ColourIds` and
`Slider::ColourIds`. Set them per component or per look-and-feel:

```cpp
label.setColour (juce::Label::textColourId, juce::Colours::black);   // one component
getLookAndFeel().setColour (juce::Slider::thumbColourId, juce::Colours::red); // all in scope
```

## Look and feel

`LookAndFeel` decides how every built-in widget draws. Subclass one of the
built-in styles (`LookAndFeel_V4` is the current default) and override only the
drawing functions you need:

```cpp
class MyLookAndFeel final : public juce::LookAndFeel_V4
{
public:
    MyLookAndFeel()
    {
        setColour (juce::Slider::thumbColourId, juce::Colours::red);
    }

    void drawRotarySlider (juce::Graphics& g, int x, int y, int width, int height,
                           float sliderPos, float startAngle, float endAngle,
                           juce::Slider&) override
    {
        auto bounds = juce::Rectangle<int> (x, y, width, height).toFloat().reduced (4.0f);
        auto radius = juce::jmin (bounds.getWidth(), bounds.getHeight()) / 2.0f;
        auto angle  = startAngle + sliderPos * (endAngle - startAngle);

        g.setColour (juce::Colours::darkgrey);
        g.fillEllipse (bounds.withSizeKeepingCentre (radius * 2, radius * 2));

        juce::Path pointer;
        pointer.addRectangle (-2.0f, -radius, 4.0f, radius * 0.6f);
        g.setColour (juce::Colours::white);
        g.fillPath (pointer, juce::AffineTransform::rotation (angle)
                                 .translated (bounds.getCentre()));
    }
};
```

Own the instance as a member and register it with `setLookAndFeel (&lf)` on a
component (it then applies to that component's children). Call
`setLookAndFeel (nullptr)` in the destructor, before the member is destroyed.
Buttons work the same way through `drawButtonBackground()` and
`drawButtonText()`. For app-wide styling use
`juce::LookAndFeel::setDefaultLookAndFeel()`.

## Animation

Derive from `juce::AnimatedAppComponent` for a component that repaints on a
timer. Implement `update()` to advance state and `paint()` to draw it:

```cpp
class Spinner final : public juce::AnimatedAppComponent
{
public:
    Spinner() { setFramesPerSecond (60); setSize (200, 200); }

    void update() override
    {
        // Prefer elapsed time to frame counts so speed is independent of frame rate
        angle += 0.002f * (float) getMillisecondsSinceLastUpdate();
    }

    void paint (juce::Graphics& g) override
    {
        auto c = getLocalBounds().getCentre().toFloat();
        g.fillAll (juce::Colours::black);
        g.setColour (juce::Colours::orange);
        g.fillEllipse (juce::Rectangle<float> (20, 20).withCentre (
            c + juce::Point<float> (std::sin (angle), std::cos (angle)) * 60.0f));
    }

private:
    float angle = 0.0f;
};
```

The same idea animates a `Path` (rebuild or transform it each frame) or a
composite shape: compute positions from time, then draw. Use
`getFrameCounter()` for frame-based effects. For animation inside an existing
component, `Timer`, `VBlankAttachment`, or `ComponentAnimator` are the
alternatives; see `examples/GUI/AnimationAppDemo.h`.

## Sources

Condensed from the JUCE tutorials *The Graphics class*, *Parent and child
components*, *The Point, Line, and Rectangle classes*, *Advanced GUI layout
techniques*, *Responsive GUI layouts using FlexBox and Grid*, *Colours in JUCE*,
*Customise the look and feel of your app*, and *Animating geometry*, Copyright
(c) Raw Material Software Limited, ISC licence. See [NOTICE.md](NOTICE.md).
