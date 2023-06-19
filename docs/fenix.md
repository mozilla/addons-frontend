# Fenix

It is sometimes useful to test AMO with a Fenix build pointing to -dev or -stage given the tight integration between these two components. We describe how to construct a custom Fenix build below.

The first step is to get a working Android development environment. The easiest way is to install [Android Studio](https://developer.android.com/studio). Follow the [Fenix build instructions](https://github.com/mozilla-mobile/firefox-android/tree/main/fenix) to get the Fenix code and construct a debug build (which will download the dependencies and compile the code).

Android Studio provides virtual devices _via_ the [AVD Manager](https://developer.android.com/studio/run/managing-avds) in case you do not have a real Android-compatible device. In order to run the Fenix debug build created before, either configure a new virtual device or use your own device, then run the following command in the Fenix directory (inside the `firefox-android` repository):

```
$ cd /path/to/firefox-android/fenix/
$ ./gradlew installFenixDebug
```

For more information, you can find more information on this page: https://developer.android.com/studio/build/building-cmdline#RunningOnDevice

## Custom build for AMO

Once you ensured that you can compile, install and run a debug Fenix build, let's update the build configuration for AMO -stage. Only a few values have to be changed in the `/path/to/firefox-android/fenix/app/build.gradle` file as shown below:

```diff
diff --git a/fenix/app/build.gradle b/fenix/app/build.gradle
index 81d60db1fc..f3c4d53ebd 100644
--- a/fenix/app/build.gradle
+++ b/fenix/app/build.gradle
@@ -45,9 +45,9 @@ android {
         buildConfigField "boolean", "USE_RELEASE_VERSIONING", "false"
         buildConfigField "String", "GIT_HASH", "\"\"" // see override in release builds for why it's blank.
         // This should be the "public" base URL of AMO.
-        buildConfigField "String", "AMO_BASE_URL", "\"https://addons.mozilla.org\""
-        buildConfigField "String", "AMO_COLLECTION_NAME", "\"Extensions-for-Android\""
-        buildConfigField "String", "AMO_COLLECTION_USER", "\"mozilla\""
+        buildConfigField "String", "AMO_BASE_URL", "\"https://addons.allizom.org\""
+        buildConfigField "String", "AMO_COLLECTION_NAME", "\"fenix\""
+        buildConfigField "String", "AMO_COLLECTION_USER", "\"11686491\""
         // These add-ons should be excluded for Mozilla Online builds.
         buildConfigField "String[]", "MOZILLA_ONLINE_ADDON_EXCLUSIONS",
                 "{" +
@@ -62,7 +62,7 @@ android {
                         "\"adnauseam@rednoise.org\"" +
                 "}"
         // This should be the base URL used to call the AMO API.
-        buildConfigField "String", "AMO_SERVER_URL", "\"https://services.addons.mozilla.org\""
+        buildConfigField "String", "AMO_SERVER_URL", "\"https://services.addons.allizom.org\""

         def deepLinkSchemeValue = "fenix-dev"
         buildConfigField "String", "DEEP_LINK_SCHEME", "\"$deepLinkSchemeValue\""
```

You may want to use your own values for `AMO_COLLECTION_USER` and `AMO_COLLECTION_NAME`. These values are used to determine which add-ons can be installed in Fenix based on an AMO collection. In this diff above, the ["fenix" collection](https://addons.allizom.org/en-US/firefox/collections/11686491/fenix/) is owned by [willdurand](https://github.com/willdurand).

Recompile and install the custom build with the following command:

```
$ cd /path/to/firefox-android/fenix/
$ ./gradlew installFenixDebug
```

The last step is to configure some prefs to be able to install -dev/-stage add-ons. Open `about:config` in your Fenix custom build and create/update the following prefs:

- `extensions.webapi.testing` set to `true`
- `xpinstall.signatures.dev-root` set to `true`

You should now be able to install add-ons from https://addons.allizom.org/ based on the list specified above.

Note: the commands above usually output different APKs for different architectures. All generated APKs can be found in `fenix/app/build/outputs/apk/fenix/debug` in case you need to share them.
