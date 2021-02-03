# Addons-frontend 🔥

[![Code of Conduct](https://img.shields.io/badge/%E2%9D%A4-code%20of%20conduct-blue.svg)](https://github.com/mozilla/addons-frontend/blob/d6a53c83b19434799f0f4f30ec8e052c603486f9/.github/CODE_OF_CONDUCT.md) [![CircleCI](https://circleci.com/gh/mozilla/addons-frontend.svg?style=svg)](https://circleci.com/gh/mozilla/addons-frontend) [![codecov](https://codecov.io/gh/mozilla/addons-frontend/branch/master/graph/badge.svg)](https://codecov.io/gh/mozilla/addons-frontend) [![Documentation](https://readthedocs.org/projects/addons-frontend/badge/?version=latest)](http://addons-frontend.readthedocs.io/en/latest/)

Front-end infrastructure and code to complement [mozilla/addons-server](https://github.com/mozilla/addons-server).

## Security Bug Reports

This code and its associated production website are included in Mozilla’s web and services [bug bounty program]. If you find a security vulnerability, please submit it via the process outlined in the program and [FAQ pages]. Further technical details about this application are available from the [Bug Bounty Onramp page].

Please submit all security-related bugs through Bugzilla using the [web security bug form].

Never submit security-related bugs through a Github Issue or by email.

[bug bounty program]: https://www.mozilla.org/en-US/security/web-bug-bounty/
[faq pages]: https://www.mozilla.org/en-US/security/bug-bounty/faq-webapp/
[bug bounty onramp page]: https://wiki.mozilla.org/Security/BugBountyOnramp/
[web security bug form]: https://bugzilla.mozilla.org/form.web.bounty

## Requirements

- You need [Node](https://nodejs.org/en/) 10.x which is the current [LTS](https://github.com/nodejs/Release) (long term support) release.
- Install [yarn](https://yarnpkg.com/en/) to manage dependencies and run scripts.

The easiest way to manage multiple node versions in development is to use [nvm](https://github.com/nvm-sh/nvm).

## Get started

If you are on Windows, please make sure to follow [windows guidelines](docs/windows.md#windows) too.

- type `yarn` to install all dependencies
- type `yarn amo:stage` to start a local server that connects to a hosted staging server

## Development commands

Here are some commands you can run:

| Command | Description |
| --- | --- |
| yarn amo:olympia | Start the dev server/proxy (for amo) using data from a local addons-server environment. |
| yarn amo:dev | Start the dev server/proxy (for amo) using data from the dev server (https://addons-dev.allizom.org/) |
| yarn amo:dev-https | Same as `amo:dev` but with HTTPS, available at: https://example.com:3000/. [Read about setting up this environment](docs/moz-addon-manager.md#developing-with-a-local-https-server-recommended) |
| yarn amo:stage | Start the dev server/proxy (for amo) using data from the staging server (https://addons.allizom.org/) |
| yarn build | Build the app. |
| yarn build-ci | Run the `build` and `bundlesize` npm scripts. |
| yarn bundlesize | Run [bundlesize][] to check the generated AMO bundle sizes. [Building AMO is required first](#building-and-running-services). |
| yarn flow | Run Flow. By default this checks for errors and exits |
| yarn flow:check | Explicitly check for Flow errors and exit |
| yarn flow:dev | Continuously check for Flow errors |
| yarn eslint | Lint the JS |
| yarn start-func-test-server | Start a Docker container for functional tests |
| yarn stylelint | Lint the SCSS |
| yarn storybook | Run [storybook](https://storybook.js.org/) |
| yarn lint | Run all the JS + SCSS linters |
| yarn prettier | Run [Prettier][] to automatically format the entire codebase |
| yarn prettier-dev | Run [Pretty-Quick][] to automatically compare and format modified source files against the master branch |
| yarn prettier-ci | Run [Prettier][] and fail if some code has been changed without being formatted |
| yarn version-check | Check you have the required dependencies |
| yarn test | Run all tests (Enters [jest][] in `--watch` mode) |
| yarn test-coverage | Run all tests and generate code coverage report (Enters [jest][] in `--watch` mode) |
| yarn test-coverage-once | Run all tests, generate code coverage report, then exit |
| yarn test-once | Run all tests, run all JS + SCSS linters, then exit |
| yarn test-ci | Run all continuous integration checks. This is only meant to run on TravisCI. |

### Running tests

You can enter the interactive [jest][] mode by typing `yarn test`. This is the easiest way to develop new features.

Here are a few tips:

- When you start `yarn test`, you can switch to your code editor and begin adding test files or changing existing code. As you save each file, [jest][] will only run tests related to the code you change.
- If you had typed `a` when you first started then [jest][] will continue to run the full suite even when you change specific files. Type `o` to switch back to the mode of only running tests related to the files you are changing.
- Sometimes running tests related to your file changes is slow. In these cases, you can type `p` or `t` to filter tests by name while you working fixing a specific test suite. [More info](https://github.com/jest-community/jest-watch-typeahead).
- If you see something like `Error watching file for changes: EMFILE` on Mac OS then `brew install watchman` might fix it. See https://github.com/facebook/jest/issues/1767

#### Run a subset of the tests

By default, `yarn test` will only run a subset of tests that relate to the code you are working on.

To explicitly run a subset of tests, you can type `t` or `p` which are explained in the [jest][] watch usage.

Alternatively, you can start the test runner with a [specific file or regular expression](https://facebook.github.io/jest/docs/en/cli.html#jest-regexfortestfiles), like:

```
yarn test tests/unit/amo/components/TestAddon.js
```

#### Run all tests

If you want to run all tests and exit, type:

```
yarn test-once
```

### Eslint

As you run tests you will see a report of Eslint errors at the end of the test output:

    yarn test

If you would like to run tests without Eslint checks, set an environment variable:

    NO_ESLINT=1 yarn test

### Flow

There is limited support for using [Flow](https://flowtype.org/) to validate the intention of our program.

As you run tests you will see a report of Flow errors at the end of the test output:

    yarn test

If you would like to run tests without Flow checks, set an environment variable:

    NO_FLOW=1 yarn test

To only check for Flow issues during development while you edit files, run:

    yarn flow:dev

If you are new to working with Flow, here are some tips:

- Check out the [getting started](https://flow.org/en/docs/getting-started/) guide.
- Read through the [web-ext guide](https://github.com/mozilla/web-ext/blob/master/CONTRIBUTING.md#check-for-flow-errors) for hints on how to solve common Flow errors.

To add flow coverage to a source file, put a `/* @flow */` comment at the top. The more source files you can opt into Flow, the better.

Here is our Flow manifesto:

- We use Flow to **declare the intention of our code** and help others refactor it with confidence. Flow also makes it easier to catch mistakes before spending hours in a debugger trying to find out what happened.
- Avoid magic [Flow declarations](https://flowtype.org/en/docs/config/libs/) for any _internal_ code. Just declare a [type alias](https://flowtype.org/en/docs/types/aliases/) next to the code where it's used and [export/import](https://flow.org/en/docs/types/modules/) it like any other object.
- Never import a real JS object just to reference its type. Make a type alias and import that instead.
- Never add more type annotations than you need. Flow is really good at inferring types from standard JS code; it will tell you when you need to add explicit annotations.
- When a function like `getAllAddons` takes object arguments, call its type object `GetAllAddonsParams`. Example:

```js
type GetAllAddonsParams = {|
  categoryId: number,
|};

function getAllAddons({ categoryId }: GetAllAddonsParams = {}) {
  ...
}
```

- Use [Exact object types](https://flowtype.org/en/docs/types/objects/#toc-exact-object-types) via the pipe syntax (`{| key: ... |}`) when possible. Sometimes the spread operator triggers an error like 'Inexact type is incompatible with exact type' but that's a [bug](https://github.com/facebook/flow/issues/2405). You can use the `Exact<T>` workaround from [`src/amo/types/util`](https://github.com/mozilla/addons-frontend/blob/master/src/amo/types/util.js) if you have to. This is meant as a working replacement for [\$Exact<T>](https://flow.org/en/docs/types/utilities/#toc-exact).
- Add a type hint for components wrapped in HOCs (higher order components) so that Flow can validate calls to the component. We need to add a hint because we don't yet have decent type coverage for all the HOCs we rely on. Here is an example:

```js
// Imagine this is something like components/ConfirmButton/index.js
import { compose } from 'redux';
import * as React from 'react';

// This expresses externally used props, i.e. to validate how the app would use <ConfirmButton />
type Props = {|
  prompt?: string | null,
|};

// This expresses internally used props, such as i18n which is injected by translate()
type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class ConfirmButtonBase extends React.Component<InternalProps> {
  render() {
    const prompt = this.props.prompt || this.props.i18n.gettext('Confirm');
    return <button>{prompt}</button>;
  }
}

// This provides a type hint for the final component with its external props.
// The i18n prop is not in external props because it is injected by translate() for internal use only.
const ConfirmButton: React.ComponentType<Props> = compose(translate())(
  ConfirmButtonBase,
);

export default ConfirmButton;
```

- Try to avoid loose types like `Object` or `any` but feel free to use them if you are spending too much time declaring types that depend on other types that depend on other types, and so on.
- You can add a `$FlowFixMe` comment to skip a Flow check if you run into a bug or if you hit something that's making you bang your head on the keyboard. If it's something you think is unfixable then use `$FlowIgnore` instead. Please explain your rationale in the comment and link to a GitHub issue if possible.
- If you're stumped on why some Flow annotations aren't working, try using the `yarn flow type-at-pos ...` command to trace which types are being applied to the code. See `yarn flow -- --help type-at-pos` for details.

### Prettier

We use [Prettier][] to automatically format our JavaScript code and stop all the on-going debates over styles.

### Pre-commit hook

We use [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged) to configure and run a pre-commit hook whenever you add a commit locally using Git. This hook will automatically run `Prettier` on your code, and will also check it for `eslint` and `flow` errors. If any errors exist, you will see a message similar to:

`✔ Reverting to original state because of errors...`

which will be followed by the details of the error(s). The last line of output will say:

`husky > pre-commit hook failed (add --no-verify to bypass)`

As per this message, you can bypass this hook by adding `--no-verify` to your `git commit` command, but we do not recommend doing this. Instead, you should fix any errors reported and then run `git commit` again, and it should succeed.

### Code coverage

To see a report of code coverage, type:

```
yarn test-coverage-once
```

This will print a table of files showing the percentage of code coverage. The uncovered lines will be shown in the right column but you can open the full report in a browser:

```
open coverage/lcov-report/index.html
```

### Running AMO for local development

A proxy server is provided for running the AMO app with the API on the same host as the frontend. This mimics our production setup.

Start developing against a hosted API like this:

```
yarn amo:dev
```

This configures the proxy to use `https://addons-dev.allizom.org` for API data. This command is the most common way to develop new frontend features. See the table of commands up above for similar ways to run the server.

To use a [local API server running in Docker](https://addons-server.readthedocs.io/en/latest/topics/install/index.html), you can use the `yarn amo` command. However, this is currently not working. See [issue-7196][].

Authentication will work when initiated from addons-frontend and will persist to addons-server but it will not work when logging in from an addons-server page. See [mozilla/addons-server#4684](https://github.com/mozilla/addons-server/issues/4684) for more information on fixing this.

### Local configuration

If you need to override any settings while running `yarn amo`, `yarn amo:dev`, or `yarn amo:stage`, first create a local config file named exactly like this:

    touch config/local-development-amo.js

Make any config changes. For example:

```javascript
module.exports = {
  trackingEnabled: true,
};
```

Restart the server to see it take affect.

Consult the [config file loading order docs](https://github.com/lorenwest/node-config/wiki/Configuration-Files#file-load-order) to learn more about how configuration is applied.

### Configuring an Android device for local development

If you want to access your local server on an Android device you will need to change a few settings. Let's say your local machine is accessible on your network at the IP address `10.0.0.1`. You could start your server like this:

```
API_HOST=http://10.0.0.1:3000 \
    SERVER_HOST=10.0.0.1 \
    WEBPACK_SERVER_HOST=10.0.0.1 \
    yarn amo:dev
```

On your Android device, you could then access the development site at `http://10.0.0.1:3000`.

**NOTE**: At this time, it is not possible to sign in with this configuration because the Firefox Accounts client redirects to `localhost:3000`. You may be able to try a different approach by editing `/etc/hosts` on your device so that `localhost` points to your development machine but this has not been fully tested.

### Disabling CSP for local development

When developing locally with a webpack server, the randomly generated asset URL will fail our Content Security Policy (CSP) and clutter your console with errors. You can turn off all CSP errors by settings CSP to `false` in any local config file, such as `local-development-amo.js`. Example:

```javascript
module.exports = {
  CSP: false,
};
```

### Working on the documentation

The documentation you are reading right now lives inside the source repository as [Github flavored Markdown](https://guides.github.com/features/mastering-markdown/#GitHub-flavored-markdown). When you make changes to these files you can create a pull request to preview them or, better yet, you can use [grip](https://github.com/joeyespo/grip) to preview the changes locally. After installing `grip`, run it from the source directory like this:

```
grip .
```

Open its `localhost` URL and you will see the rendered `README.md` file. As you make edits, it will update automatically.

### Storybook

If you run `yarn storybook`, you can see storybook locally here: http://localhost:9001/.

You can find the source files under the ./stories directory.

Check it out on Github Pages: https://mozilla.github.io/addons-frontend/

More info coming soon :)

### Building and running services

The following are scripts that are used in deployment - you generally won't need unless you're testing something related to deployment or builds.

The env vars are:

- `NODE_ENV`: the node environment, e.g. `production` or `development`
- `NODE_CONFIG_ENV`: the name of the configuration to load, e.g., `dev`, `stage`, `prod`

| Script     | Description                                    |
| ---------- | ---------------------------------------------- |
| yarn start | Starts the express server (requires env vars)  |
| yarn build | Builds the libs (all apps) (requires env vars) |

**Example:** Building and running a production instance of the app:

```
NODE_ENV=production NODE_CONFIG_ENV=prod yarn build
NODE_ENV=production NODE_CONFIG_ENV=prod yarn start
```

**Note: To run the app locally in production mode you'll need to create a config file for local production builds.** It must be saved as `config/local-prod-amo.js` and should look like:

```js
const amoCDN = 'http://127.0.0.1:4000';

module.exports = {
  // CDN URL points to the Node server.
  amoCDN,

  // Configure CSP with 'self' since we serve the compiled files from `dist/`.
  CSP: {
    directives: {
      fontSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://addons.cdn.mozilla.net'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
    reportOnly: true,
  },

  // Serve static via Node.
  staticHost: undefined,
  enableNodeStatics: true,

  // No need for Sentry.
  publicSentryDsn: null,
};
```

After this, re-build and restart using `yarn build` and `yarn start` as documented above. If you have used `127.0.0.1` before with a different configuration, be sure to clear your cookies. The application should be available at: http://127.0.0.1:4000/.

**NOTE**: At this time, it's not possible to sign in using this approach.

### Working with UX Mocks

When implementing user interfaces you will need to refer to the [Sketch](https://www.sketchapp.com/)-based mocks that are hosted on InVision: https://mozilla.invisionapp.com/share/YCCYEOFRH#/screens.

If you need to explore the Sketch source file, you will need a license to run Sketch and you also need to install some fonts (which are free). Install [Fira Sans](https://www.fontsquirrel.com/fonts/fira-sans), [Open Sans](https://www.fontsquirrel.com/fonts/open-sans), [Fira Mono](https://www.fontsquirrel.com/fonts/fira-mono) and [Chivo](https://www.fontsquirrel.com/fonts/chivo).

On MacOS, you can use the Homebrew tap [Caskroom-fonts](https://github.com/Homebrew/homebrew-cask-fonts):

```
brew tap homebrew/cask-fonts
brew cask install font-fira-sans font-open-sans font-chivo font-fira-mono
```

## What version is deployed?

You can check to see what commit of `addons-frontend` is deployed, which A/B experiments are running, or which feature flags are enabled by making a request like this:

```
curl https://addons-dev.allizom.org/__frontend_version__
{
    "build": "https://circleci.com/gh/mozilla/addons-frontend/10333",
    "commit": "47edfa6f24e333897b25516c587f504e294e8fa9",
    "experiments": {
        "homeHero": true
    },
    "feature_flags": {
        "enableFeatureAMInstallButton": true,
        "enableFeatureExperienceSurvey": false,
        "enableFeatureStaticThemes": true
    },
    "source": "https://github.com/mozilla/addons-frontend",
    "version": ""
}
```

This will return a 415 response if a `version.json` file doesn't exist in the root directory. This file is typically generated by the deploy process.

For consistency with monitoring scripts, the same data can be retrieved at this URL:

```
curl https://addons-dev.allizom.org/__version__
```

:bulb: You can install the [amo-info extension](https://addons.mozilla.org/en-US/firefox/addon/amo-info/) to easily view this information.

## Core technologies

- Based on Redux + React
- Code written in ES2015+
- Universal rendering via node
- Unit tests with high coverage (aiming for 100%)

[bundlesize]: https://github.com/siddharthkp/bundlesize
[jest]: https://jestjs.io/docs/en/getting-started.html
[prettier]: https://prettier.io/
