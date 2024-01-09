/*

This dependency breaks in remix. It is a CJS that imports an ESM module using esm()(require)

This is a known issue in remix with a solution implemented: https://remix.run/docs/en/main/guides/gotchas#importing-esm-packages. However, it does not seem to work in this case. Potentially as this is a transitive depenedency of i18next-fluent-backend.

error:

 info  building...
 info  built (350ms)

/Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/i18next-fluent-backend/dist/commonjs/index.js:9
var _ftl2js = _interopRequireDefault(require("fluent_conv/esm/ftl2js"));
                                     ^
Error [ERR_REQUIRE_ESM]: require() of ES Module /Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/fluent_conv/esm/ftl2js.js from /Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/i18next-fluent-backend/dist/commonjs/index.js not supported.
Instead change the require of ftl2js.js in /Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/i18next-fluent-backend/dist/commonjs/index.js to a dynamic import() which is available in all CommonJS modules.
    at Object.<anonymous> (/Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/i18next-fluent-backend/dist/commonjs/index.js:9:38)
    at Object.<anonymous> (/Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/i18next-fluent-backend/index.js:1:18)

Adding "i18next-fluent-backend" to remix.config `serverDependenciesToBundle` doesn't fix the issue but gives a new error


Even manually copying the source code as ESM and letting remix do all the compiling is resulting in strange source map errors.

Error: ENOENT: no such file or directory, open '/Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/i18next/dist/esm/i18next.js.map'
    at Object.openSync (node:fs:603:3)
    at Object.readFileSync (node:fs:471:35)
    at Array.retrieveSourceMap (/Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/@remix-run/serve/dist/cli.js:50:37)
    at /Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/source-map-support/source-map-support.js:85:24
    at mapSourcePosition (/Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/source-map-support/source-map-support.js:216:21)
    at wrapCallSite (/Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/source-map-support/source-map-support.js:397:20)
    at Function.prepareStackTrace (/Users/kmeinhardt/src/mozilla/addons-frontend/remix/node_modules/source-map-support/source-map-support.js:446:39)
    at maybeOverridePrepareStackTrace (node:internal/errors:140:29)
    at prepareStackTrace (node:internal/errors:114:5)
    at getStackString (node:internal/util/inspect:1240:16)


*/
import Backend from "./i18next-fluent-backend-local";
import { resolve } from "node:path";
import { RemixI18Next } from "remix-i18next";
import i18n from "./config"; // your i18n configuration file
import { initReactI18next } from "react-i18next";
import { i18n as i18nInstance } from "i18next";

let i18next = new RemixI18Next({
  detection: {
    supportedLanguages: i18n.supportedLngs,
    fallbackLanguage: i18n.fallbackLng,
  },
  i18next: {
    ...i18n,
    backend: {
      loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
    },
  },
  // Typescript complains here because we hacked the code.. would need to make this type safe.
  plugins: [Backend as any],
});

export async function init(instance: i18nInstance, lng: any, ns: any) {

  await instance
    .use(initReactI18next) // Tell our instance to use react-i18next
    // Typescript complains here because we hacked the code.. would need to make this type safe.
    .use(Backend as any) // Setup our backend
    .init({
      ...i18n, // spread the configuration
      lng, // The locale we detected above
      ns, // The namespaces the routes about to render wants to use
      backend: { loadPath: resolve("./public/locales/{{lng}}/{{ns}}.ftl") },
    });
}

export default i18next;
