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

Refresh the page and you should see `mozAddonManager` as a JavaScript global.

## Developing on Android

The presence of `mozAddonManager` on Firefox for Android will activate the
add-on installation switch.

In addition to setting the preference up above,
you also need to make sure your user agent looks like Firefox for Android.
On desktop, you can
[save a custom device](https://developer.mozilla.org/en-US/docs/Tools/Responsive_Design_Mode#Saving_custom_devices)
in
[Responsive Design Mode](https://developer.mozilla.org/en-US/docs/Tools/Responsive_Design_Mode)
with a
[Firefox for Android user agent string](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent/Firefox#Android_(version_41_and_above)).
Make sure it is touch enabled.
This will allow you to test out the fancy add-on installation switch.

## Developing locally

When you're running a server locally for development, you won't be able to set
the pref above and see `mozAddonManager`. You need to allow your `localhost`
domain for that.

You can do this by building a custom Firefox with an allowance for your `localhost` domain.

Start by
[setting up your machine to build Firefox](https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Build_Instructions).
That page gives you a link to a helpful bootstrapping script. You can run it
like this:

```
python bootstrap.py
```

It will ask you what version of Firefox you want to build.
Choose:

```
Firefox for Desktop
```

Do not choose the artifact build because unfortunately you have to compile c++ code.
It will prompt you to install some dependencies. Re-run it until you have
everything installed and configured.

You then need to check out a clone of [mozilla-central]().

Change into the source directory and apply this patch to allow a local server
at a URL like `localhost:3000` (notice that the port does not need to be
defined):

```diff
diff --git a/toolkit/mozapps/extensions/AddonManager.jsm b/toolkit/mozapps/extensions/AddonManager.jsm
--- a/toolkit/mozapps/extensions/AddonManager.jsm
+++ b/toolkit/mozapps/extensions/AddonManager.jsm
@@ -64,16 +64,17 @@ var PREF_EM_CHECK_COMPATIBILITY = MOZ_CO

 const VALID_TYPES_REGEXP = /^[\w\-]+$/;

 const WEBAPI_INSTALL_HOSTS = ["addons.mozilla.org", "testpilot.firefox.com"];
 const WEBAPI_TEST_INSTALL_HOSTS = [
   "addons.allizom.org", "addons-dev.allizom.org",
   "testpilot.stage.mozaws.net", "testpilot.dev.mozaws.net",
   "example.com",
+  "localhost",
 ];

 const URI_XPINSTALL_DIALOG = "chrome://mozapps/content/xpinstall/xpinstallConfirm.xul";

 Cu.import("resource://gre/modules/Services.jsm");
 Cu.import("resource://gre/modules/XPCOMUtils.jsm");
 Cu.import("resource://gre/modules/AsyncShutdown.jsm");

diff --git a/toolkit/mozapps/extensions/AddonManagerWebAPI.cpp b/toolkit/mozapps/extensions/AddonManagerWebAPI.cpp
--- a/toolkit/mozapps/extensions/AddonManagerWebAPI.cpp
+++ b/toolkit/mozapps/extensions/AddonManagerWebAPI.cpp
@@ -45,16 +45,17 @@ IsValidHost(const nsACString& host) {
   // When testing allow access to the developer sites.
   if (Preferences::GetBool("extensions.webapi.testing", false)) {
     if (host.LowerCaseEqualsLiteral("addons.allizom.org") ||
         host.LowerCaseEqualsLiteral("discovery.addons.allizom.org") ||
         host.LowerCaseEqualsLiteral("addons-dev.allizom.org") ||
         host.LowerCaseEqualsLiteral("discovery.addons-dev.allizom.org") ||
         host.LowerCaseEqualsLiteral("testpilot.stage.mozaws.net") ||
         host.LowerCaseEqualsLiteral("testpilot.dev.mozaws.net") ||
+        host.LowerCaseEqualsLiteral("localhost") ||
         host.LowerCaseEqualsLiteral("example.com")) {
       return true;
     }
   }

   return false;
 }

@@ -64,19 +65,16 @@ bool
 AddonManagerWebAPI::IsValidSite(nsIURI* uri)
 {
   if (!uri) {
     return false;
   }

   bool isSecure;
   nsresult rv = uri->SchemeIs("https", &isSecure);
-  if (NS_FAILED(rv) || !isSecure) {
-    return false;
-  }

   nsAutoCString host;
   rv = uri->GetHost(host);
   if (NS_FAILED(rv)) {
     return false;
   }

   return IsValidHost(host);

```

This patch will:
1. allow you to use an HTTP connection
2. grant access to `mozAddonManager` for any URL at `localhost` (on any port).

With this patch, you can build Firefox. Once again, make sure you aren't
configured for an artifact build since that won't work (you'll need to build c++
code). Build it!

```
./mach build
```

The first one will take a while but subsequent builds will be faster.
Here's how to run it with a named profile so you don't lose your settings:

```
./mach run --profile mozilla-central
```

When Firefox starts up, go to `about:config` to make sure the development
setting is set to `true`:

```
extensions.webapi.testing
```

If you go to an add-on detail page on `localhost:3000` with the proper Firefox
for Android user agent string (as explained above) then you should see a
fancy installation switch.
