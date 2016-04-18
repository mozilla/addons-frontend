
[![Build Status](https://travis-ci.org/mozilla/addons-frontend.svg?branch=master)](https://travis-ci.org/mozilla/addons-frontend)
[![Coverage Status](https://coveralls.io/repos/github/mozilla/addons-frontend/badge.svg?branch=master)](https://coveralls.io/github/mozilla/addons-frontend?branch=master)

# Addons-frontend 🔥

Front-end infrastructure and code to complement mozilla/addons-server

## Requirements

* Node 4.x LTS
* npm 3.x

The easiest way to manage multiple node versions in development is to use
nvm. See https://github.com/creationix/nvm for more info.

## Get started

* npm install
* npm run dev


## NPM scripts

| Script                 | Description                                           |
|------------------------|-------------------------------------------------------|
| npm start              |  Starts the express server (prod mode all apps)       |
| npm start:disco        |  Starts the express server (prod mode discovery pane) |
| npm start:search       |  Starts the express server (prod mode search)         |
| npm test               |  Runs the tests                                       |
| npm run build          |  Builds the libs (all apps)                           |
| npm run build:disco    |  Builds the libs (discovery pane)                     |
| npm run build:search   |  Builds the libs (search)                             |
| npm run dev            |  Starts the dev server (Express + webpack)            |
| npm run dev:search     |  As above but just the search code                    |
| npm run dev:disco      |  As above but just the discovery pane code            |
| npm run lint           |  Lints the files with `eslint` (Run in `npm test`)    |
| npm run eslint         |  An alias for `npm run lint`                          |
| npm run version-check  |  Checks you have the minimum node + npm versions      |


### Running a production build of a specific app:

Running a specific prod build is as follows:

```
npm run build:search && npm run start:search
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
