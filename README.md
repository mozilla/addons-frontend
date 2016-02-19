# addons-frontend 🔥

Front-end infrastructure and code to complement mozilla/addons-server

## Overview and rationale

This project will hold several distinct front-ends e.g: 

* Editors search tool
* Discovery Pane
* and beyond...

We've made a conscious decision to avoid "premature modularization" and keep this all in one repository. This will help us build out the necessary tooling to support a universal front-end infrastructure without having to worry about cutting packages and bumping versions the entire time. 

At a later date if we need to move things out into their own project we still can.

## Core technologies

* Based on Redux + React
* Code written in ES2015+ 
* Universal rendering via node
* Unit tests with high coverage (aiming for 100%)
