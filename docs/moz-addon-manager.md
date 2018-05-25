# Develop features for mozAddonManager

The AMO and Discovery Pane apps use the
[`mozAddonManager`](https://bugzilla.mozilla.org/show_bug.cgi?id=1310752)
web API to achieve a more seamless add-on installation user experience.
However, this API is only available to a limited list of domains.
If you go to https://addons.mozilla.org (production) in Firefox then `mozAddonManager`
is available on the page. If you go to a development site then it's not.

## Turning on mozAddonManager for development

To access `mozAddonManager` on a development site like
https://addons-dev.allizom.org or https://addons.allizom.org
go to `about:config` in Firefox and set this property to `true`:

```
extensions.webapi.testing
```

Refresh the page, open the JavaScript console, and you should see a global `mozAddonManager` object.

## Install add-ons for development

To fully install add-ons from a development site like
https://addons-dev.allizom.org or https://addons.allizom.org
you will need to tell Firefox to honor their signing certificates.
Go to `about:config` in Firefox and set this property to `true`:

```
xpinstall.signatures.dev-root
```

If you do not see an entry for `xpinstall.signatures.dev-root` in `about:config` you will need to add one by doing the following: 

Right click in `about:config`, select `new` and then add `xpinstall.signatures.dev-root` as `Boolean`.

Restart Firefox to put it into effect. This pref allows
you to fully install add-on and theme files.


## Developing on Android

The presence of the `mozAddonManager` API on Firefox for Android will activate
the add-on installation switch. Again, you will see this on
https://addons.mozilla.org (production) but not on a development site.

To activate access to this API on a development site, first
make sure you set the `extensions.webapi.testing` preference to `true`.
If you're testing on an Android device then you can now
access `mozAddonManager`.

If you're testing on desktop Firefox to emulate Android (for development),
you need to make sure your user agent looks like Firefox for Android.
You can
[save a custom device](https://developer.mozilla.org/en-US/docs/Tools/Responsive_Design_Mode#Saving_custom_devices)
in
[Responsive Design Mode](https://developer.mozilla.org/en-US/docs/Tools/Responsive_Design_Mode)
with a
[Firefox for Android user agent string](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent/Firefox#Android_(version_41_and_above)).
Make sure it is touch enabled.
This will let you see the add-on installation switch on desktop.

## Developing with a local server

When you're running a server locally for development, you need to grant `mozAddonManager`
access to your `localhost` domain in addition to setting the `extensions.webapi.testing` preference to `true`.

You can do this by building a version of Firefox with a custom patch.

Start by
[setting up your machine to build Firefox](https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Build_Instructions).
That page gives you a link to a helpful bootstrapping script. Run it like this:

```
python bootstrap.py
```

It will ask you what version of Firefox you want to build.
Choose:

```
Firefox for Desktop
```

Do not choose the artifact build because unfortunately you have to compile C++ code.
It will prompt you to install some dependencies. Re-run it until you have
everything installed and configured.

After you have everything, the bootstrap script prompts you to
check out a clone of [mozilla-central](https://hg.mozilla.org/mozilla-central/).

Change into the source directory and apply this patch to allow a local server
at a URL like `localhost:3000`.

```diff
diff --git a/browser/base/content/browser-addons.js b/browser/base/content/browser-addons.js
--- a/browser/base/content/browser-addons.js
+++ b/browser/base/content/browser-addons.js
@@ -664,12 +664,11 @@ var LightWeightThemeWebInstaller = {
   },
 
   _isAllowed(principal) {
-    if (!principal || !principal.URI || !principal.URI.schemeIs("https")) {
+    if (!principal || !principal.URI) {
       return false;
     }
 
-    let pm = Services.perms;
-    return pm.testPermission(principal.URI, "install") == pm.ALLOW_ACTION;
+    return true;
   },
 
   _shouldShowUndoPrompt(principal) {
diff --git a/toolkit/mozapps/extensions/AddonManager.jsm b/toolkit/mozapps/extensions/AddonManager.jsm
--- a/toolkit/mozapps/extensions/AddonManager.jsm
+++ b/toolkit/mozapps/extensions/AddonManager.jsm
@@ -57,7 +57,7 @@ const WEBAPI_INSTALL_HOSTS = ["addons.mo
 const WEBAPI_TEST_INSTALL_HOSTS = [
   "addons.allizom.org", "addons-dev.allizom.org",
   "testpilot.stage.mozaws.net", "testpilot.dev.mozaws.net",
-  "example.com",
+  "example.com", "localhost",
 ];
 
 const URI_XPINSTALL_DIALOG = "chrome://mozapps/content/xpinstall/xpinstallConfirm.xul";
diff --git a/toolkit/mozapps/extensions/AddonManagerWebAPI.cpp b/toolkit/mozapps/extensions/AddonManagerWebAPI.cpp
--- a/toolkit/mozapps/extensions/AddonManagerWebAPI.cpp
+++ b/toolkit/mozapps/extensions/AddonManagerWebAPI.cpp
@@ -57,6 +57,7 @@ IsValidHost(const nsACString& host) {
         host.LowerCaseEqualsLiteral("discovery.addons-dev.allizom.org") ||
         host.LowerCaseEqualsLiteral("testpilot.stage.mozaws.net") ||
         host.LowerCaseEqualsLiteral("testpilot.dev.mozaws.net") ||
+        host.LowerCaseEqualsLiteral("localhost") ||
         host.LowerCaseEqualsLiteral("example.com")) {
       return true;
     }
```

This patch will:
1. allow you to use an HTTP connection
2. allow any page at `localhost` (on any port) to access `mozAddonManager` and
   perform some theme actions.

You can use `patch` to apply this patch:

```
patch -p1 < /path/to/patch-file.diff
```

With this patch applied, you are ready to build Firefox. Once again, make sure
you aren't configured for an artifact build since that won't work
(you'll need to build C++ code). Build it!

```
./mach build
```

The first one will take a while but subsequent builds will be faster.
Here's how to run it with a named profile so you don't lose your settings:

```
./mach run --profile mozilla-central
```

When Firefox starts up, go to `about:config` to make sure the development
preference is set to `true`:

```
extensions.webapi.testing
```

If you go to an add-on detail page on `localhost:3000` with the proper Firefox
for Android user agent string (as explained above) then you should see a
fancy installation switch. It worked!

If it doesn't work, you may need to add some logging and re-build Firefox.
Try setting `extensions.logging.enabled` to `true` in `about:config` to see
logging output for the `AddonManager.jsm` code.

When you click the switch, it will only let you install add-ons if your
localhost is *proxying* https://addons-dev.allizom.org or https://addons.allizom.org .
This is because Firefox needs signing certificates and the certs are not configurable.
You can set the `xpinstall.signatures.dev-root` preference to `true`
(as documented above) to activate certificates for the development sites.

### Updating your Firefox source code

You will need to periodically update your Firefox source code and rebuild it
with your patch.

First, set aside your patch by reverting the changes or using something like the
[shelve](https://www.mercurial-scm.org/wiki/ShelveExtension) command:

```
hg shelve
```

Pull in new updates:

```
hg pull -u
```

Re-apply your patch with `unshelve` (or by following the steps above):

```
hg unshelve
```

Now you are ready to build Firefox again. You can check the output of `hg diff`
to make sure the patch is still there and then kick off a new build:

```
./mach build
```
