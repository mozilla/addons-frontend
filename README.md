
[![Build Status](https://travis-ci.org/mozilla/addons-frontend.svg?branch=master)](https://travis-ci.org/mozilla/addons-frontend)
[![Coverage Status](https://coveralls.io/repos/github/mozilla/addons-frontend/badge.svg?branch=master)](https://coveralls.io/github/mozilla/addons-frontend?branch=master)

[Documentation](http://addons-frontend.readthedocs.io/en/latest/)

# Addons-frontend 🔥

Front-end infrastructure and code to complement
[mozilla/addons-server](https://github.com/mozilla/addons-server).

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

| Script                 | Description                                         |
|------------------------|-----------------------------------------------------|
| npm run dev:admin      |  Starts the dev server (admin app)                 |
| npm run dev:amo        |  Starts the dev server (amo)                        |
| npm run dev:disco      |  Starts the dev server (discovery pane)             |
| npm run eslint         |  Lints the JS                                       |
| npm run stylelint      |  Lints the SCSS                                     |
| npm run lint           |  Runs all the JS + SCSS linters                     |
| npm run version-check  |  Checks you have the minimum node + npm versions    |
| npm test               |  Runs the unittest, servertests + lint              |
| npm run unittest       |  Runs just the unittests                            |
| npm run unittest:dev   |  Runs the unittests and watches for changes         |
| npm run servertest     |  Runs the servertests                               |

### Code coverage

The `npm run unittest` command generates a report of how well the unit tests
covered each line of source code.
The continuous integration process will give you a link to view the report.
To see this report while running tests locally, type:

    open ./coverage/index.html

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
