[![Code of Conduct](https://img.shields.io/badge/%E2%9D%A4-code%20of%20conduct-blue.svg)](https://github.com/mozilla/addons-frontend/blob/master/CODE_OF_CONDUCT.md)
[![Build Status](https://travis-ci.org/mozilla/addons-frontend.svg?branch=master)](https://travis-ci.org/mozilla/addons-frontend)
[![Coverage Status](https://coveralls.io/repos/github/mozilla/addons-frontend/badge.svg?branch=master)](https://coveralls.io/github/mozilla/addons-frontend?branch=master)
[![Documentation](https://readthedocs.org/projects/addons-frontend/badge/?version=latest)](http://addons-frontend.readthedocs.io/en/latest/)

# Addons-frontend 🔥

Front-end infrastructure and code to complement
[mozilla/addons-server](https://github.com/mozilla/addons-server).

## Security Bug Reports

This code and it’s associated production website are included in Mozilla’s web and services [bug bounty program]. If you find a security vulnerability, please submit it via the process outlined in the program and [FAQ pages]. Further technical details about this application are available from the [Bug Bounty Onramp page].

Please submit all security-related bugs through Bugzilla using the [web security bug form].

Never submit security-related bugs through a Github Issue or by email.

  [bug bounty program]: https://www.mozilla.org/en-US/security/web-bug-bounty/
  [FAQ pages]: https://www.mozilla.org/en-US/security/bug-bounty/faq-webapp/
  [Bug Bounty Onramp page]: https://wiki.mozilla.org/Security/BugBountyOnramp/
  [web security bug form]: https://bugzilla.mozilla.org/form.web.bounty

## Requirements

* You need [Node](https://nodejs.org/) 6.x which is the current
  [LTS](https://github.com/nodejs/LTS) (long term support) release.
* To make life easier, also install [yarn](https://yarnpkg.com/en/).

The easiest way to manage multiple node versions in development is to use
[nvm](https://github.com/creationix/nvm).

## Get started

* type `yarn` to install all dependencies
* type `yarn dev:amo` to start a dev server

## Development commands

Here are some commands you can run:

| Command              | Description                                                                     |
|----------------------|---------------------------------------------------------------------------------|
| yarn dev:admin       |  Starts the dev server (admin app)                                              |
| yarn dev:amo         |  Starts the dev server and proxy (amo)                                          |
| yarn dev:amo:no-proxy|  Starts the dev server without proxy (amo)                                      |
| yarn dev:disco       |  Starts the dev server (discovery pane)                                         |
| yarn flow:check      |  Check for Flow errors and exit                                                 |
| yarn flow:dev        |  Continuously check for Flow errors                                             |
| yarn eslint          |  Lints the JS                                                                   |
| yarn stylelint       |  Lints the SCSS                                                                 |
| yarn lint            |  Runs all the JS + SCSS linters                                                 |
| yarn version-check   |  Checks you have the required dependencies                                      |
| yarn test            |  Enters [jest][] in watch mode                                                  |
| yarn test-ci         |  Runs all continuous integration checks. This is only meant ro run on TravisCI. |
| yarn test-coverage   |  Runs all tests and reports code coverage                                       |
| yarn test-once       |  Runs all tests with [jest][] and exits                                         |

### Running tests

You can enter the interactive [jest][] mode by typing `yarn test`.
This is the easiest way to develop new features.

Here are a few tips:
* When you start `yarn test`, you can switch to your code editor and begin
  adding test files or changing existing code. As you save each file, [jest][]
  will only run tests related to the code you change.
* If you had typed `a` when you first started then [jest][] will continue to
  run the full suite even when you change specific files. Type `o` to switch
  back to the mode of only running tests related to the files you are changing.

#### Run a subset of the tests

By default, `yarn test` will only run a subset of tests that relate to the code
you are working on.

If you only want to run a few tests, you can start with a test file, like:
````
yarn test tests/server/TestCSPConfig.js
````

If you are already in `yarn test`, you can type `t` to match a test name by
keyword. For example, type "CSP" to run the tests in the file up above.

#### Run all tests

If you want to run all tests and exit, type:
````
yarn test-once
````

### Flow

There is limited support for using [Flow](https://flowtype.org/)
to check for problems in the source code.

To check for Flow issues during development while you edit files, run:

    yarn flow:dev

If you are new to working with Flow, here are some tips:
* Check out the [getting started](https://flow.org/en/docs/getting-started/) guide.
* Read through the [web-ext guide](https://github.com/mozilla/web-ext/blob/master/CONTRIBUTING.md#check-for-flow-errors)
  for hints on how to solve common Flow errors.

To add flow coverage to a source file, put a `/* @flow */` comment at the top.
The more source files you can opt into Flow, the better.

Here is our Flow manifesto:

* We use Flow to **declare the intention of our code** and help others
  refactor it with confidence.
  Flow also makes it easier to catch mistakes before spending hours in a debugger
  trying to find out what happened.
* Avoid magic [Flow declarations](https://flowtype.org/en/docs/config/libs/)
  for any *internal* code. Just declare a
  [type alias](https://flowtype.org/en/docs/types/aliases/) next to the code
  where it's used and
  [export/import](https://flow.org/en/docs/types/modules/) it like any other object.
* Never import a real JS object just to reference its type. Make a type alias
  and import that instead.
* Never add more type annotations than you need. Flow is really good at
  inferring types from standard JS code; it will tell you
  when you need to add explicit annotations.
* When a function like `getAllAddons` takes object arguments, call its
  type object `GetAllAddonsParams`. Example:

````js
type GetAllAddonsParams = {|
  categoryId: number,
|};

function getAllAddons({ categoryId }: GetAllAddonsParams = {}) {
  ...
}
````

* Use [Exact object types](https://flowtype.org/en/docs/types/objects/#toc-exact-object-types)
  via the pipe syntax (`{| key: ... |}`) when possible. Sometimes the
  spread operator triggers an error like
  'Inexact type is incompatible with exact type' but that's a
  [bug](https://github.com/facebook/flow/issues/2405).
  You can use the `Exact<T>` workaround from
  [`src/core/types/util`](https://github.com/mozilla/addons-frontend/blob/master/src/core/types/util.js)
  if you have to. This is meant as a working replacement for
  [$Exact<T>](https://flow.org/en/docs/types/utilities/#toc-exact).
* Try to avoid loose types like `Object` or `any` but feel free to use
  them if you are spending too much time declaring types that depend on other
  types that depend on other types, and so on.
* You can add a `$FLOW_FIXME` comment to skip a Flow check if you run
  into a bug or if you hit something that's making you bang your head on
  the keyboard. If it's something you think is unfixable then use
  `$FLOW_IGNORE` instead. Please explain your rationale in the comment and link
  to a GitHub issue if possible.

### Code coverage

To see a report of code coverage, type:
````
yarn test-coverage
````

This will print a table of files showing the percentage of code coverage.
The uncovered lines will be shown in the right column but you can open
the full report in a browser:

    open coverage/lcov-report/index.html

### Running AMO for local development

A proxy server is provided for running the AMO app with the API on the same host as the frontend.
This provides a setup that is closer to production than running the frontend on its own. The
default configuration for this is to use a local addons-server for the API which can be setup
according to the
[addons-server docs](https://addons-server.readthedocs.io/en/latest/topics/install/index.html).
Docker is the preferred method of running addons-server.

Authentication will work when initiated from addons-frontend and will persist to addons-server but
it will not work when logging in from an addons-server page. See
[mozilla/addons-server#4684](https://github.com/mozilla/addons-server/issues/4684) for more
information on fixing this.

If you would like to use `https://addons-dev.allizom.org` for the API you should use the
`yarn dev:amo:no-proxy` command with an `API_HOST` to start the server without the proxy. For
example: `API_HOST=https://addons-dev.allizom.org yarn dev:amo:no-proxy`.

### Configuring for local development

The `dev` scripts above will connect to a hosted development API by default.
If you want to run your own
[addons-server](https://github.com/mozilla/addons-server)
API or make any other local changes, just add a local configuration
file for each app. For example, to run your own discovery pane API, first create
a local config file:

    touch config/local-development-disco.js

Be sure to prefix the file with **local-development-** so that it doesn't pollute the
test suite.
Here's what `local-development-disco.js` would look like when
overriding the `apiHost` parameter so that it points to your docker container:

````javascript
module.exports = {
  apiHost: 'http://olympia.dev',
};
````

When you start up your front-end discover pane server, it will now apply
overrides from your local configuration file:

    yarn dev:disco

Consult the
[config file loading order docs](https://github.com/lorenwest/node-config/wiki/Configuration-Files#file-load-order)
to learn more about how configuration is applied.

#### Disabling CSP for local development

When developing locally with a webpack server, the randomly generated asset
URL will fail our Content Security Policy (CSP) and clutter your console
with errors. You can turn off all CSP errors by settings CSP to `false`
in any local config file, such as `local-development-amo.js`. Example:

````javascript
module.exports = {
  CSP: false,
};
````

### Building and running services

The following are scripts that are used in deployment - you generally won't
need unless you're testing something related to deployment or builds.

The env vars are:

`NODE_APP_INSTANCE` this is the name of the app e.g. 'disco'
`NODE_ENV` this is the node environment. e.g. production, dev, stage, development.

| Script                 | Description                                         |
|------------------------|-----------------------------------------------------|
| yarn start          |  Starts the express server (requires env vars)      |
| yarn build          |  Builds the libs (all apps) (requires env vars)     |

Example: Building and running a production instance of the AMO app:

````
NODE_APP_INSTANCE=amo NODE_ENV=production yarn build
NODE_APP_INSTANCE=amo NODE_ENV=production yarn start
````

To run the app locally in production mode you'll need to create a config file
that looks something like this. Name it exactly as `config/local-production-amo.js`.

````js
import { apiStageHost, amoStageCDN } from './lib/shared';

module.exports = {
  // Statics will be served by node.
  staticHost: '',
  // FIXME: sign-in isn't working.
  // fxaConfig: 'local',

  // The node server host and port.
  serverHost: '127.0.0.1',
  serverPort: 3000,

  enableClientConsole: true,
  apiHost: apiStageHost,
  amoCDN: amoStageCDN,

  CSP: {
    directives: {
      connectSrc: [
        apiStageHost,
      ],
      scriptSrc: [
        "'self'",
        'https://www.google-analytics.com',
      ],
      styleSrc: ["'self'"],
      imgSrc: [
        "'self'",
        'data:',
        amoStageCDN,
        'https://www.google-analytics.com',
      ],
      mediaSrc: ["'self'"],
      fontSrc: [
        "'self'",
        'data:',
        amoStageCDN,
      ],
    },
  },

  // This is needed to serve assets locally.
  enableNodeStatics: true,
  trackingEnabled: false,
  // Do not send client side errors to Sentry.
  publicSentryDsn: null,
};
````

After this, re-build and restart using `yarn build` and `yarn start`
as documented above.
If you have used `localhost` before with a different configuration,
be sure to clear your cookies.

**NOTE**: At this time, it's not possible to sign in using this approach.

## What version is deployed?

You can check to see what commit of `addons-frontend` is deployed by
making a request like this:

````
curl https://addons-dev.allizom.org/__frontend_version__
{
   "build" : "https://circleci.com/gh/mozilla/addons-server/6550",
   "commit" : "87f49a40ee7a5e87d9b9efde8e91b9019e8b13d1",
   "source" : "https://github.com/mozilla/addons-server",
   "version" : ""
}
````

This will return a 415 response if a `version.json` file doesn't exist
in the root directory. This file is typically generated by the deploy process.

For consistency with monitoring scripts, the same data can be retrieved
at this URL:

````
curl https://addons-dev.allizom.org/__version__
````

## Overview and rationale

This project will hold distinct front-ends e.g:

* Editors' admin/search tool
* Discovery Pane
* and beyond...

We've made a conscious decision to avoid "premature modularization" and
keep this all in one repository. This will help us build out the necessary
tooling to support a universal front-end infrastructure without having to
worry about cutting packages and bumping versions the entire time.

At a later date if we need to move things out into their own project we
still can.

## Core technologies

* Based on Redux + React
* Code written in ES2015+
* Universal rendering via node
* Unit tests with high coverage (aiming for 100%)

[jest]: http://facebook.github.io/jest/docs/en/getting-started.html
