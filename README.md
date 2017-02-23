
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

* Node 4.x LTS
* npm 3.x

The easiest way to manage multiple node versions in development is to use
[nvm](https://github.com/creationix/nvm).

## Get started

* npm install
* npm run dev


## NPM scripts for development

Generic scripts that don't need env vars. Use these for development:

| Script                  | Description                                           |
|-------------------------|-------------------------------------------------------|
| npm run dev:admin       |  Starts the dev server (admin app)                    |
| npm run dev:amo         |  Starts the dev server and proxy (amo)                |
| npm run dev:amo:no-proxy|  Starts the dev server without proxy (amo)            |
| npm run dev:disco       |  Starts the dev server (discovery pane)               |
| npm run eslint          |  Lints the JS                                         |
| npm run stylelint       |  Lints the SCSS                                       |
| npm run lint            |  Runs all the JS + SCSS linters                       |
| npm run version-check   |  Checks you have the minimum node + npm versions      |
| npm test                |  Runs the unittest, servertests + lint                |
| npm run unittest        |  Runs just the unittests                              |
| npm run unittest:dev    |  Runs the unittests and watches for changes           |
| npm run unittest:server |  Starts a unittest server for use with `unittest:run` |
| npm run unittest:run    |  Executes unittests (requires `unittest:server`)      |
| npm run servertest      |  Runs the servertests                                 |

### Running tests

You can run the entire test suite with `npm test` but there are a few other ways
to run tests.

#### Run all unit tests in a loop

You can use `npm run unittest:dev` to run all unit tests in a loop while you
edit the source code.

#### Run a subset of the unit tests

If you don't want to run the entire unit test suite, first you have to start a
unittest server:

    npm run unittest:server

When you see "Connected on socket," the server has fully started.

Now you can execute a more specific [mocha](https://mochajs.org/) command,
such as using `--grep` to run only a few tests. Here is an example:

    npm run unittest:run -- --grep=InfoDialog

This would run all tests that either fall under the `InfoDialog` description grouping
or have `InfoDialog` in their behavior text.

Any option after the double dash (`--`) gets sent to `mocha`. Check out
[mocha's usage](https://mochajs.org/#usage) for ideas.

### Code coverage

The `npm run unittest` command generates a report of how well the unit tests
covered each line of source code.
The continuous integration process will give you a link to view the report.
To see this report while running tests locally, type:

    open ./coverage/index.html

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
`npm run dev:amo:no-proxy` command with an `API_HOST` to start the server without the proxy. For
example: `API_HOST=https://addons-dev.allizom.org npm run dev:amo:no-proxy`.

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

    npm run dev:disco

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
| npm run start          |  Starts the express server (requires env vars)      |
| npm run build          |  Builds the libs (all apps) (requires env vars)     |

Example: Building and running a production instance of the admin app:

```
NODE_APP_INSTANCE=admin NODE_ENV=production npm run build && npm run start
```

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
