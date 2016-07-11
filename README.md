
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
nvm. See https://github.com/creationix/nvm for more info.

## Get started

* npm install
* npm run dev


## NPM scripts for development

Generic scripts that don't need env vars. Use these for development:

| Script                 | Description                                         |
|------------------------|-----------------------------------------------------|
| npm run dev:amo        |  Starts the dev server (amo)                        |
| npm run dev:disco      |  Starts the dev server (discovery pane)             |
| npm run dev:search     |  Starts the dev server (search app)                 |
| npm run eslint         |  Lints the JS                                       |
| npm run stylelint      |  Lints the SCSS                                     |
| npm run lint           |  Runs all the JS + SCSS linters                     |
| npm run version-check  |  Checks you have the minimum node + npm versions    |
| npm test               |  Runs the unittest, servertests + lint              |
| npm run unittest       |  Runs just the unittests                            |
| npm run unittest:dev   |  Runs the unittests and watches for changes         |
| npm run servertest     |  Runs the servertests                               |

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

Example: Building and running a production instance of the search app:

```
NODE_APP_INSTANCE=search NODE_ENV=production npm run build && npm run start
```

## Overview and rationale

This project will hold several distinct front-ends e.g:

* Editors search tool
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
