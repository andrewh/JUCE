# Mobile and app services: Android, purchases, notifications, analytics, and licensing

Building for Android and iOS, and wiring an app to the services around it.

**Level:** Intermediate to advanced  
**Platforms:** Android, iOS, macOS, Windows (varies per section)

Most of these features need accounts and configuration on external services, and
those steps change often. This guide gives the JUCE side of each, and points out what
must be set up elsewhere. Check each platform's current documentation for the
account-side steps.

## Set up the project

The project below shows the screen details a mobile app has to cope with (size, orientation, scale, and DPI), links every module the later sections use, and runs on desktop as well as iOS. Use the desktop build to try the in-app purchase, notification, analytics, and unlocking code that the platform allows, and a phone or tablet for the rest.

This guide builds on [Getting started](01-getting-started.md). Make a copy of the
`HelloJuce` folder from that tutorial, **without** its `build` folder, and name
the copy `MobileServicesDemo`. Replace all four files so the folder looks like this:

```text
MobileServicesDemo/
├── CMakeLists.txt      # new: renamed target, modules for this guide
├── Main.cpp            # new: tutorial 1's, changed for mobile
├── MainComponent.h     # new: replaces the one from tutorial 1
└── MainComponent.cpp   # new: replaces the one from tutorial 1
```

Replace `/path/to/JUCE` in `CMakeLists.txt` with the folder you cloned JUCE into, as in tutorial 1. This `CMakeLists.txt` renames the target to `MobileServicesDemo` and links the modules this guide needs.

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
project(MOBILESERVICESDEMO VERSION 0.0.1)

add_subdirectory(/path/to/JUCE JUCE)   # or find_package (JUCE CONFIG REQUIRED)

juce_add_gui_app(MobileServicesDemo PRODUCT_NAME "Mobile Services Demo"
    NEEDS_STORE_KIT TRUE            # links StoreKit and enables juce::InAppPurchases on Apple platforms
    PUSH_NOTIFICATIONS_ENABLED TRUE)   # adds the push-notification entitlement on Apple platforms

target_sources(MobileServicesDemo PRIVATE Main.cpp MainComponent.cpp)

target_compile_definitions(MobileServicesDemo PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_PUSH_NOTIFICATIONS=1   # use the real juce::PushNotifications, not the no-op stub
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:MobileServicesDemo,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:MobileServicesDemo,JUCE_VERSION>")

target_link_libraries(MobileServicesDemo
    PRIVATE juce::juce_gui_extra
            juce::juce_product_unlocking
            juce::juce_analytics
    PUBLIC  juce::juce_recommended_config_flags
            juce::juce_recommended_warning_flags)
```

**`Main.cpp`**

```cpp
#include "MainComponent.h"

class MobileServicesDemoApplication final : public juce::JUCEApplication
{
public:
    const juce::String getApplicationName() override    { return JUCE_APPLICATION_NAME_STRING; }
    const juce::String getApplicationVersion() override { return JUCE_APPLICATION_VERSION_STRING; }

    void initialise (const juce::String&) override
    {
        mainWindow.reset (new MainWindow (getApplicationName()));
    }

    void shutdown() override { mainWindow = nullptr; }  // deletes the window

    void systemRequestedQuit() override { quit(); }

    class MainWindow final : public juce::DocumentWindow
    {
    public:
        explicit MainWindow (juce::String name)
            : DocumentWindow (name, juce::Colours::lightgrey, allButtons)
        {
            setUsingNativeTitleBar (true);
            setContentOwned (new MainComponent(), true);

           #if JUCE_IOS || JUCE_ANDROID
            setFullScreen (true);
           #else
            setResizable (true, true);
            centreWithSize (getWidth(), getHeight());
           #endif

            setVisible (true);
        }

        void closeButtonPressed() override
        {
            juce::JUCEApplication::getInstance()->systemRequestedQuit();
        }
    };

private:
    std::unique_ptr<MainWindow> mainWindow;
};

START_JUCE_APPLICATION (MobileServicesDemoApplication)
```

**`MainComponent.h`**

```cpp
#pragma once

#include <juce_gui_extra/juce_gui_extra.h>
#include <juce_product_unlocking/juce_product_unlocking.h>
#include <juce_analytics/juce_analytics.h>

class MainComponent final : public juce::Component
{
public:
    MainComponent();

    void paint (juce::Graphics& g) override;
    void resized() override;

private:
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

**`MainComponent.cpp`**

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    setSize (480, 640);   // ignored on phones and tablets, where the window is full screen
}

void MainComponent::paint (juce::Graphics& g)
{
    g.fillAll (getLookAndFeel().findColour (juce::ResizableWindow::backgroundColourId));
    g.setColour (juce::Colours::white);
    g.setFont (juce::FontOptions (18.0f));

    juce::String text;
    text << "Component: " << getWidth() << " x " << getHeight() << " logical pixels\n"
         << (getWidth() > getHeight() ? "Landscape" : "Portrait") << "\n";

    if (auto* display = juce::Desktop::getInstance().getDisplays().getPrimaryDisplay())
        text << "Display scale: " << display->scale << "\n"
             << "Display DPI: " << display->dpi << "\n"
             << "User area: " << display->userBounds.toString() << "\n";

    juce::String orientation;

    switch (juce::Desktop::getInstance().getCurrentOrientation())
    {
        case juce::Desktop::upright:              orientation = "Upright"; break;
        case juce::Desktop::upsideDown:           orientation = "Upside down"; break;
        case juce::Desktop::rotatedClockwise:     orientation = "Rotated clockwise"; break;
        case juce::Desktop::rotatedAntiClockwise: orientation = "Rotated anticlockwise"; break;
        case juce::Desktop::allOrientations:      break;
    }

    text << "Orientation: " << orientation;

    g.drawFittedText (text, getLocalBounds().reduced (16), juce::Justification::topLeft, 10);
}

void MainComponent::resized()
{
    repaint();   // the text above depends on the size
}
```

**iOS.** The same project builds for iOS with CMake's Xcode generator. Give it your
Apple developer team so Xcode can sign the app, then open the generated project and
run it on a simulator or device:

```sh
cmake -B build-ios -G Xcode -DCMAKE_SYSTEM_NAME=iOS \
      -DCMAKE_XCODE_ATTRIBUTE_DEVELOPMENT_TEAM=YOUR_TEAM_ID
open build-ios/*.xcodeproj
```

**Android.** JUCE's CMake API does not currently support Android targets, so Android
projects come from the Projucer, as the next section describes. To try this
project's code there, create a *GUI Application* in the Projucer, add the
`juce_product_unlocking` and `juce_analytics` modules, add an Android exporter, and
replace the generated `Main.cpp` and `MainComponent` files with the ones above. In
`MainComponent.h`, change the include to `#include <JuceHeader.h>`, which is how
Projucer projects reach the module headers.

## Getting started with Android

Requirements (see the README for the supported versions): **Android Studio**, the
Android **SDK**, and the **NDK** (NDK 26 for this JUCE version; minimum device
Android 7, API level 24). Install them through Android Studio's *SDK Manager*.

1. Install Android Studio and, from its SDK Manager, an SDK platform plus the NDK.
2. Tell JUCE where they are. In the Projucer, use *Global Search Paths* to set the
   Android SDK (for example `~/Library/Android/sdk` on macOS or
   `%LOCALAPPDATA%\Android\sdk` on Windows) and the NDK inside it. Correct paths
   show in white.
3. Create a project with an Android exporter, set the *minimum SDK version* to one
   you have installed, and save. The Projucer generates a Gradle project.
4. Open the generated project in Android Studio and run it on an emulator or
   device.

For a GUI app, make the window fill the screen instead of centring a small window:

```cpp
setUsingNativeTitleBar (true);
setContentOwned (new MainComponent(), true);

#if JUCE_IOS || JUCE_ANDROID
 setFullScreen (true);
#else
 setResizable (true, true);
 centreWithSize (getWidth(), getHeight());
#endif

setVisible (true);
```

(The CMake `GuiApp` example makes exactly this distinction.)

## Managing screen sizes

Phones and tablets differ in physical size, resolution, and orientation, and a user
can rotate at any time. JUCE scales its coordinate system by the display's pixel
density, so a button of the same logical size is a similar physical size on different
screens. The DPI reported by the OS is only approximate, though, so test on real
devices. Query the display with `Desktop::getInstance().getDisplays().getPrimaryDisplay()`
(`scale`, `dpi`, `userBounds`).

Four strategies, from simplest to most flexible:

1. **Resize the children.** Lay children out from `getLocalBounds()` in `resized()`
   (see [Graphics, layout, and animation](02-graphics-and-layout.md)). It is easy, but
   an interface designed for a phone can become sparse on a tablet, or unreadably
   small on a tiny screen.
2. **Scale the whole interface with a transform.** Design at a fixed nominal size
   and scale it to fit:

```cpp
void resized() override
{
    const int contentWidth = 480, contentHeight = 640;
    auto scale = juce::jmin ((float) getWidth()  / (float) contentWidth,
                             (float) getHeight() / (float) contentHeight);

    content.setTransform (juce::AffineTransform::scale (scale));
    content.centreWithSize (contentWidth, contentHeight);
}
```

3. **Different layouts per orientation.** Test `getWidth() > getHeight()` in
   `resized()` and call a portrait or landscape layout function (for example one column
   of controls versus two). Combine with a transform, choosing the nominal size per
   orientation. Restrict rotation with `Desktop::setOrientationsEnabled()`, and read
   it with `getCurrentOrientation()`.
4. **Different layouts per size class.** Choose by the available width in
   *logical* pixels (compact, regular, and so on), and reuse the same child
   components in each arrangement.

Touch interfaces need bigger targets: enlarge slider thumbs with a custom
`LookAndFeel` (`getSliderThumbRadius()`), increase spacing, and avoid interactions that
depend on hover.

## In-app purchases

`juce::InAppPurchases` (module `juce_product_unlocking`) wraps the Apple App Store and
Google Play billing APIs behind one interface. Enable it with the module option
`JUCE_IN_APP_PURCHASES=1`. In CMake, set `NEEDS_STORE_KIT TRUE` on the target, as the
project above does, which defines it and links Apple's StoreKit framework on Apple
platforms; in the Projucer, use the in-app purchases flag. Without it the class is not
declared. The flow:

1. In the store consoles (App Store Connect, Google Play Console), define your
   products and choose types: consumable, non-consumable, or subscription.
2. In the app, check `isInAppPurchasesSupported()`, register as a `Listener`, and ask
   for product information.
3. Start purchases, then react to asynchronous results.

```cpp
class Store final : private juce::InAppPurchases::Listener
{
public:
    Store()
    {
        auto& iap = *juce::InAppPurchases::getInstance();
        if (! iap.isInAppPurchasesSupported()) return;

        iap.addListener (this);
        iap.getProductsInformation ({ "com.example.app.pro", "com.example.app.pack1" });
        iap.restoreProductsBoughtList (true);     // find what the user already owns
    }

    ~Store() override { juce::InAppPurchases::getInstance()->removeListener (this); }

    void buy (const juce::String& productId)
    {
        juce::InAppPurchases::getInstance()->purchaseProduct (productId);
    }

private:
    void productsInfoReturned (const juce::Array<juce::InAppPurchases::Product>& products) override
    {
        for (auto& p : products)
            DBG (p.identifier << ": " << p.title << " " << p.price);   // build your store UI from these
    }

    void productPurchaseFinished (const PurchaseInfo& info, bool success, const juce::String& status) override
    {
        if (success)
            for (auto& id : info.purchase.productIds)
                unlock (id);                               // grant the item, then persist it
        else
            DBG ("Purchase failed: " << status);
    }

    void purchasesListRestored (const juce::Array<PurchaseInfo>& purchases, bool success, const juce::String&) override
    {
        if (success)
            for (auto& p : purchases)
                for (auto& id : p.purchase.productIds)
                    unlock (id);
    }

    void unlock (const juce::String& productId);           // your logic
};
```

- Every result is **asynchronous**, and listener callbacks run on the message thread.
  Never assume an item is owned until `productPurchaseFinished()` says so. Use
  product IDs exactly as defined in the store.
- Consumables must be *consumed* after delivery on Android (`consumePurchase()`) so
  they can be bought again.
- Always offer a "Restore purchases" action, and verify receipts on a server for
  anything valuable.
- Testing needs a signed build uploaded to the store's test track (Android) or a
  sandbox tester account (Apple), so expect to configure app IDs, bundle IDs, and
  signing before the first call returns anything.

## Push and local notifications

`juce::PushNotifications` (module `juce_gui_extra`) handles both kinds:

- **Local:** the app asks the operating system to show or schedule a message. No
  network needed.
- **Remote:** a server pushes a message through Apple Push Notification service
  (iOS and macOS) or Firebase Cloud Messaging (Android).

```cpp
class Notifier final : private juce::PushNotifications::Listener
{
public:
    Notifier()
    {
        auto& pn = *juce::PushNotifications::getInstance();
        pn.addListener (this);

        juce::PushNotifications::Settings settings;         // choose alerts, sounds, badges, categories
        settings.allowAlert = true;
        settings.allowBadge = true;
        settings.allowSound = true;
        pn.requestPermissionsWithSettings (settings);        // asks the user on iOS, macOS, and Android 13+
    }

    ~Notifier() override { juce::PushNotifications::getInstance()->removeListener (this); }

    void sendLocal()
    {
        juce::PushNotifications::Notification n;
        n.identifier = "reminder-1";
        n.title      = "Reminder";
        n.body       = "Your render has finished.";
        n.badgeNumber = 1;
        n.properties = juce::JSON::parse ("{ \"jobId\": 42 }");   // your own payload
        juce::PushNotifications::getInstance()->sendLocalNotification (n);
    }

private:
    void handleNotification (bool isLocal, const juce::PushNotifications::Notification& n) override
    {
        DBG ((isLocal ? "Local: " : "Remote: ") << n.title << " / " << n.body);
    }

    void handleNotificationAction (bool, const juce::PushNotifications::Notification&,
                                   const juce::String& actionIdentifier,
                                   const juce::String& optionalResponse) override
    {
        DBG ("Action " << actionIdentifier << " " << optionalResponse);
    }

    void deviceTokenRefreshed (const juce::String& token) override
    {
        // Send this token to your server: it is the address for remote pushes
    }
};
```

- **Permissions first.** Notifications are off until the user allows them, and the
  settings you request (alert, sound, badge, action categories) are per platform.
  `areNotificationsEnabled()` reports the current state.
- **Actions and customisation.** A `Notification` can carry action buttons
  (`Notification::Action`, optionally with text input), categories, a sound, a
  large icon, and grouping on Android, with channels (`Settings::Channel`) for Android's
  notification categories.
- **Remote setup.** iOS and macOS need the *Push Notifications* capability, a signing
  identity, and a push certificate or key. Android needs a Firebase project and its
  `google-services.json` in the app, plus the Projucer's remote-notifications option
  and resources listed individually in the exporter. Topic subscription
  (`subscribeToTopic()`) and upstream messages (`sendUpstreamMessage()`) are
  available on Android.
- Custom sounds and icons must be bundled: as Xcode resources on Apple platforms,
  and as explicit resource entries on Android.

## Analytics

`juce_analytics` collects events on a background thread and delivers them in batches to
one or more *destinations*, so your UI thread never waits on the network.

```cpp
auto& analytics = *juce::Analytics::getInstance();

analytics.setUserId ("anon-1234");                       // avoid personal data

juce::StringPairArray userProperties;
userProperties.set ("group", "beta");
analytics.setUserProperties (userProperties);

analytics.addDestination (new MyDestination());          // Analytics owns it

analytics.logEvent ("startup", {}, 0);

juce::StringPairArray exportParams;
exportParams.set ("id", "export");
analytics.logEvent ("button_press", exportParams, 0);

// Automatic tracking of a button: logs "button_press" on every click
std::unique_ptr<juce::ButtonTracker> tracker
    (new juce::ButtonTracker (exportButton, "button_press", exportParams));
```

An event has a name, optional parameters, a type, a timestamp, a user ID, and user
properties. A destination derives from `ThreadedAnalyticsDestination`:

```cpp
class MyDestination final : public juce::ThreadedAnalyticsDestination
{
public:
    MyDestination() : ThreadedAnalyticsDestination ("AnalyticsThread")
    {
        startAnalyticsThread (initialPeriodMs);
    }

    ~MyDestination() override
    {
        juce::Thread::sleep (initialPeriodMs);           // give the last batch a chance to be sent
        stopAnalyticsThread (1000);                      // mandatory in every subclass
    }

    int getMaximumBatchSize() override { return 20; }

    bool logBatchedEvents (const juce::Array<AnalyticsEvent>& events) override
    {
        // Turn events into one HTTP request for your analytics service, POST it
        // (for example with juce::URL and WebInputStream), and return true on success.
        // On failure, back off: periodMs *= 2; setBatchPeriod (periodMs);
        return sendToServer (events);
    }

    void stopLoggingEvents() override
    {
        // The app is quitting: cancel any request in progress so shutdown does not hang
    }

private:
    // Called as the app shuts down: keep whatever could not be sent (quickly: the timeout in
    // stopAnalyticsThread() covers this and stopLoggingEvents())
    void saveUnloggedEvents (const std::deque<AnalyticsEvent>& eventsToSave) override
    {
        juce::XmlElement root ("events");

        for (auto& e : eventsToSave)
        {
            auto* xml = root.createNewChildElement ("event");
            xml->setAttribute ("name", e.name);
            xml->setAttribute ("type", e.eventType);
            xml->setAttribute ("timestamp", (int) e.timestamp);
            xml->setAttribute ("user_id", e.userID);

            auto* params = xml->createNewChildElement ("parameters");
            for (auto& key : e.parameters.getAllKeys())
                params->setAttribute (key, e.parameters[key]);
        }

        root.writeTo (savedEventsFile);
    }

    // Called on the analytics thread at start-up: these events are sent first
    void restoreUnloggedEvents (std::deque<AnalyticsEvent>& restoredEventQueue) override
    {
        if (auto root = juce::XmlDocument::parse (savedEventsFile))
            for (auto* xml : root->getChildIterator())
            {
                AnalyticsEvent e;
                e.name      = xml->getStringAttribute ("name");
                e.eventType = xml->getIntAttribute ("type");
                e.timestamp = (juce::uint32) xml->getIntAttribute ("timestamp");
                e.userID    = xml->getStringAttribute ("user_id");

                if (auto* params = xml->getChildByName ("parameters"))
                    for (int i = 0; i < params->getNumAttributes(); ++i)
                        e.parameters.set (params->getAttributeName (i), params->getAttributeValue (i));

                restoredEventQueue.push_back (e);
            }

        savedEventsFile.deleteFile();
    }

    juce::File savedEventsFile = juce::File::getSpecialLocation (juce::File::userApplicationDataDirectory)
                                     .getChildFile ("MyApp").getChildFile ("analytics_events.xml");

    static constexpr int initialPeriodMs = 1000;
    bool sendToServer (const juce::Array<AnalyticsEvent>&);
};
```

- Call `stopAnalyticsThread()` in the destructor of every subclass, or the thread
  outlives the object.
- `saveUnloggedEvents()` and `restoreUnloggedEvents()` are pure virtual: you must decide
  how to keep unsent events between runs (XML in the application data directory works
  well), so a lost connection does not lose data. Create the folder for the file
  before first use.
- The original tutorial demonstrated a Google Analytics "Universal Analytics"
  destination. That service stopped processing data in 2023, so send events to
  your current analytics provider's HTTP API instead. The structure above does not
  change.
- Collect only what you need, prefer anonymous IDs, and follow the privacy law and
  store rules that apply to you (consent, disclosure, opt-out).

## Locking and unlocking a product

`juce_product_unlocking` also supports *online registration*: the app sends a
user's credentials to your server, which replies with a signed key that unlocks the
product on that machine.

How it works: your server holds an RSA **private key**. After it authorises a
user, it signs a reply containing the product and machine IDs. The app carries the
matching **public key** and checks the signature. Only the private-key holder can
produce a valid reply, so an attacker cannot forge one.

Implement a subclass of `OnlineUnlockStatus`:

```cpp
class MarketplaceStatus final : public juce::OnlineUnlockStatus
{
public:
    juce::String getProductID() override                        { return "MyApp"; }
    bool doesProductIDMatch (const juce::String& id) override   { return getProductID() == id; }
    juce::String getWebsiteName() override                      { return "example.com"; }
    juce::URL getServerAuthenticationURL() override             { return juce::URL ("https://example.com/auth"); }
    juce::RSAKey getPublicKey() override                        { return juce::RSAKey ("PUBLIC_KEY_HERE"); }

    // Persist the unlock state between runs
    void saveState (const juce::String& s) override { properties.setValue ("unlockState", s); }
    juce::String getState() override                { return properties.getValue ("unlockState"); }

    juce::String readReplyFromWebserver (const juce::String& email, const juce::String& password) override;

private:
    static juce::PropertiesFile::Options makeOptions()
    {
        juce::PropertiesFile::Options o;
        o.applicationName = "MyApp";
        o.filenameSuffix  = ".settings";
        return o;
    }

    juce::PropertiesFile properties { makeOptions() };
};
```

Show the built-in `OnlineUnlockForm` (email and password) and dismiss it on
success or cancel:

```cpp
class UnlockForm final : public juce::OnlineUnlockForm
{
public:
    explicit UnlockForm (MarketplaceStatus& s) : OnlineUnlockForm (s, "Please enter your email and password.") {}
    void dismiss() override { setVisible (false); }
};

// In the UI: unlockButton.onClick = [this] { form.setVisible (true); };
// Poll or listen for the result: if (status.isUnlocked()) enableFeatures();
```

The server replies with XML, either
`<MESSAGE message="Thanks!"><KEY>...</KEY></MESSAGE>` (using
`KeyGeneration::generateKeyFile()` with your private key) or
`<ERROR error="..."/>`. Generate the RSA key pair with `RSAKey::createKeyPair()`, and
keep the private key only on the server. For local testing you need HTTPS, so a
self-signed certificate plus a TLS tunnel such as `stunnel` in front of a
development web server works.

Security notes:

- Check `isUnlocked()` at *several* points in your code, at the places where
  protected features run, rather than once at start-up: a single check is easy to
  patch out.
- No client-side scheme is unbreakable. Treat this as a way to keep honest users
  honest, and combine it with sensible pricing and support.
- Never ship the private key, and use HTTPS for the server.

## Build and run

With all the files in place, configure and build from the project folder:

```sh
cmake -B build
cmake --build build
```

The build puts the finished app in `build/MobileServicesDemo_artefacts/`. With CMake's default generator on each platform (Makefiles on macOS and Linux, and
Visual Studio on Windows, which adds the `Debug` folder):

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/MobileServicesDemo_artefacts/Mobile Services Demo.app"` |
| Linux    | `./build/MobileServicesDemo_artefacts/Mobile\ Services\ Demo` |
| Windows  | `"build\MobileServicesDemo_artefacts\Debug\Mobile Services Demo.exe"` |

In PowerShell, put `&` before the quoted path.

Xcode and Visual Studio are multi-config generators and add a configuration folder,
for example `build/MobileServicesDemo_artefacts/Debug/Mobile Services Demo.app`; build with
`cmake --build build --config Debug`. With Ninja there is no configuration folder, so
drop `Debug` from the Windows path.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build build`
> reported errors, fix them and build again, then re-run `open`. Check that the
> last lines of the build output say `Built target MobileServicesDemo`.

> **"use of undeclared identifier 'juce'"?** CMake projects have no
> `JuceHeader.h`, so every source file must include the module headers it uses.
> `MainComponent.h` includes them and `Main.cpp` includes `MainComponent.h`.
> Without those includes the compiler does not know what `juce::`, `std::`, or
> `START_JUCE_APPLICATION` mean.

## Sources

Condensed from the JUCE tutorials *Getting started with Android*, *Managing Android
screen sizes*, *In-App Purchases on desktop and mobile devices*, *Push
Notifications on desktop and mobile devices*, *App analytics collection*, and
*Unlock your plugins through online registration*, Copyright (c) Raw Material
Software Limited, ISC licence. See [NOTICE.md](NOTICE.md).
