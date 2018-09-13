[![Code of Conduct](https://img.shields.io/badge/%E2%9D%A4-code%20of%20conduct-blue.svg)](https://github.com/mozilla/addons-frontend/blob/master/CODE_OF_CONDUCT.md) [![Build Status](https://travis-ci.org/mozilla/addons-frontend.svg?branch=master)](https://travis-ci.org/mozilla/addons-frontend) [![codecov](https://codecov.io/gh/mozilla/addons-frontend/branch/master/graph/badge.svg)](https://codecov.io/gh/mozilla/addons-frontend) [![Documentation](https://readthedocs.org/projects/addons-frontend/badge/?version=latest)](http://addons-frontend.readthedocs.io/en/latest/)

# Addons-frontend 🔥

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

- You need [Node](https://nodejs.org/) 8.x which is the current [LTS](https://github.com/nodejs/LTS) (long term support) release.
- Install [yarn](https://yarnpkg.com/en/) to manage dependencies and run scripts.

The easiest way to manage multiple node versions in development is to use [nvm](https://github.com/creationix/nvm).

## Get started

- read our [contributing guidelines](./CONTRIBUTING.md) and our [code of conduct](./CODE_OF_CONDUCT.md)
- type `yarn` to install all dependencies
- type `yarn amo:stage` to start a local server that connects to a hosted staging server

## Development commands

Here are some commands you can run:

| Command                     | Description                                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| yarn amo                    | Start the dev server/proxy (for amo) using data from Docker.                                                                                                                                     |
| yarn amo:dev                | Start the dev server/proxy (for amo) using data from the dev server (https://addons-dev.allizom.org/).                                                                                           |
| yarn amo:dev-https          | Same as `amo:dev` but with HTTPS, available at: https://example.com:3000/. [Read about setting up this environment](docs/moz-addon-manager.md#developing-with-a-local-https-server-recommended). |
| yarn amo:no-proxy           | Start the dev server without a proxy (for amo) using data from Docker.                                                                                                                           |
| yarn amo:stage              | Start the dev server/proxy (for amo) using data from the staging server (https://addons.allizom.org/).                                                                                           |
| yarn build                  | Build an app specified with the `NODE_APP_INSTANCE` environment variable.                                                                                                                        |
| yarn build-all              | Build all the applications.                                                                                                                                                                      |
| yarn build-ci               | Run the `build-all` and `bundlesize` npm scripts.                                                                                                                                                |
| yarn bundlesize             | Run [bundlesize][] to check the generated AMO bundle sizes. [Building AMO is required first](#building-and-running-services).                                                                    |
| yarn disco                  | Start the dev server (for Discovery Pane) using data from the dev server (https://addons-dev.allizom.org/).                                                                                      |
| yarn disco:https            | Same as `disco` but with HTTPS, available at: https://example.com:3000/. [Read about setting up this environment](docs/moz-addon-manager.md#developing-with-a-local-https-server-recommended).   |
| yarn flow                   | Run Flow. By default this checks for errors and exits.                                                                                                                                           |
| yarn flow:check             | Explicitly check for Flow errors and exit.                                                                                                                                                       |
| yarn flow:dev               | Continuously check for Flow errors.                                                                                                                                                              |
| yarn eslint                 | Lint the JS.                                                                                                                                                                                     |
| yarn snyk                   | Run [snyk](#snyk) (without a command).                                                                                                                                                           |
| yarn snyk-ci                | Run [snyk](#snyk) `test` and `monitor`.                                                                                                                                                          |
| yarn snyk-wizard            | Run [snyk](#snyk) `wizard` to fix an issue reported by snyk.                                                                                                                                     |
| yarn start-func-test-server | Start a Docker container for functional tests.                                                                                                                                                   |
| yarn stylelint              | Lint the SCSS.                                                                                                                                                                                   |
| yarn storybook              | Run [storybook](https://storybook.js.org/).                                                                                                                                                      |
| yarn lint                   | Run all the JS + SCSS linters.                                                                                                                                                                   |
| yarn prettier               | Run [Prettier][] to automatically format the entire codebase.                                                                                                                                    |
| yarn prettier-dev           | Run [Pretty-Quick][] to automatically compare and format modified source files against the master branch.                                                                                        |
| yarn prettier-ci            | Run [Prettier][] and fail if some code has been changed without being formatted.                                                                                                                 |
| yarn version-check          | Check you have the required dependencies.                                                                                                                                                        |
| yarn test                   | Run all tests (Enters [jest][] in `--watch` mode).                                                                                                                                               |
| yarn test-coverage          | Run all tests and generate code coverage report (Enters [jest][] in `--watch` mode).                                                                                                             |
| yarn test-coverage-once     | Run all tests, generate code coverage report, then exit.                                                                                                                                         |
| yarn test-once              | Run all tests, run all JS + SCSS linters, then exit.                                                                                                                                             |
| yarn test-ci                | Run all continuous integration checks. This is only meant to run on TravisCI.                                                                                                                    |

### :sparkles: Documentation :sparkles:

You will find more documentation in the [`docs/` folder](./docs/index.md).

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

### Flow

There is limited support for using [Flow](https://flowtype.org/) to check for problems in the source code.

To check for Flow issues during development while you edit files, run:

    yarn flow:dev

If you are new to working with Flow, here are some tips:

- Check out the [getting started](https://flow.org/en/docs/getting-started/) guide.
- Read through the [web-ext guide](https://github.com/mozilla/web-ext/blob/master/CONTRIBUTING.md#check-for-flow-errors) for hints on how to solve common Flow errors.

### Prettier

We use [Prettier][] to automatically format our JavaScript code and stop all the on-going debates over styles. As a developer, you have to run it (with `yarn prettier-dev`) before submitting a Pull Request.

### Snyk

We use [snyk][] to continuously monitor our application's dependencies.

As a member of the `add-ons-team`, you can fix an issue reported by running:

```
yarn snyk-wizard
```

The wizard allows you to decide whether you want to upgrade dependencies or ignore the issue for 30 days. See the existing reasons to ignore an issue in the [`.snyk`](.snyk) file. Snyk is a bit intrusive and changes many things (like re-adding `snyk test` to the npm `test` script): double check your changes before submitting a Pull Request. You have successfully fixed an issue when `yarn snyk-ci` does not complain. Make sure you open a Pull Request with a branch pushed to this repository and not from your fork, because the `snyk-ci` job (Travis CI) does not run on forks.

Note: You should authenticate yourself once by running `yarn snyk auth` (no dash). It will open a link in your favorite browser and authenticate you locally.

### Code coverage

To see a report of code coverage, type:

```
yarn test-coverage-once
```

This will print a table of files showing the percentage of code coverage. The uncovered lines will be shown in the right column but you can open the full report in a browser:

```
open coverage/lcov-report/index.html
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

More info coming soon :)

## Working with UX Mocks

When implementing user interfaces you will need to refer to the [Sketch](https://www.sketchapp.com/) mocks that are located in the [assets](https://github.com/mozilla/addons-frontend/tree/master/assets) directory. You will need a license to run Sketch and you also need to install some fonts (which are free). Install [Fira Sans](https://www.fontsquirrel.com/fonts/fira-sans), [Open Sans](https://www.fontsquirrel.com/fonts/open-sans), [Fira Mono](https://www.fontsquirrel.com/fonts/fira-mono) and [Chivo](https://www.fontsquirrel.com/fonts/chivo).

On MacOS, you can use the Homebrew tap [Caskroom-fonts](https://github.com/Homebrew/homebrew-cask-fonts):

```
brew tap homebrew/cask-fonts
brew cask install font-fira-sans font-open-sans font-chivo font-fira-mono
```

## What version is deployed?

You can check to see what commit of `addons-frontend` is deployed by making a request like this:

```
curl https://addons-dev.allizom.org/__frontend_version__
{
   "build" : "https://circleci.com/gh/mozilla/addons-server/6550",
   "commit" : "87f49a40ee7a5e87d9b9efde8e91b9019e8b13d1",
   "source" : "https://github.com/mozilla/addons-server",
   "version" : ""
}
```

This will return a 415 response if a `version.json` file doesn't exist in the root directory. This file is typically generated by the deploy process.

For consistency with monitoring scripts, the same data can be retrieved at this URL:

```
curl https://addons-dev.allizom.org/__version__
```

## Overview and rationale

This project will hold distinct front-ends e.g:

- Discovery Pane
- AMO or `addons.mozilla.org`

We've made a conscious decision to avoid "premature modularization" and keep this all in one repository. This will help us build out the necessary tooling to support a universal front-end infrastructure without having to worry about cutting packages and bumping versions the entire time.

At a later date if we need to move things out into their own project we still can.

## Core technologies

- Based on Redux + React
- Code written in ES2015+
- Universal rendering via node
- Unit tests with high coverage (aiming for 100%)

[bundlesize]: https://github.com/siddharthkp/bundlesize
[jest]: https://facebook.github.io/jest/docs/en/getting-started.html
[prettier]: https://prettier.io/
[pretty-quick]: https://www.npmjs.com/package/pretty-quick
[snyk]: https://snyk.io/
