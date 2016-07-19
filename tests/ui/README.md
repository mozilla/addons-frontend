UI Tests for Add-Ons Discovery Pane (discopane)
==================================

Thank you for checking out Mozilla's addons-frontend ui test suite.
This repository contains Selenium tests used to test the discovery pane.

How to run the tests locally
-----------------------------------------

### Clone the repository
If you have cloned this project already then you can skip this, otherwise you'll need to clone this repo using Git.
If you do not know how to clone a GitHub repository, check out this
[help page][git-clone] from GitHub.

If you think you would like to contribute to the tests by writing or maintaining them in the future,
it would be a good idea to create a fork of this repository first, and then clone that.
GitHub also has great instructions for [forking a repository][git-fork].

### Create or activate a Python virtual environment
You should install this project's dependencies (which is described in the next step) into a virtual environment
in order to avoid impacting the rest of your system, and to make problem solving easier.
If you already have a virtual environment for these tests, then you should activate it,
otherwise you should create a new one.
For more information on working with virtual environments see our
[summary][virtualenv].

### Install dependencies
Install the Python packages that are needed to run our tests using pip. In a terminal,
from the the project root, issue the following command:

```bash
$ pip install -Ur requirements.txt
```

### Run the tests
Tests are run using the command line. Below are a couple of examples of running the tests:

Before running, ensure the [GeckoDriver executable][geckodriver] (wires) is in your path.

Note: The tests must be run in Firefox 48 or later.

```bash
$ py.test --firefox-path=<path-to-firefox> test_discopane.py
```

To run against a different environment, pass in a value for `--base-url`, like so:

```bash
$ py.test --base-url https://discovery.addons.mozilla.org --firefox-path=<path-to-firefox> test_discopane.py
```

The pytest plugin that we use for running tests has a number of advanced
command line options available. To see the options available, run
`py.test --help`. The full documentation for the plugin can be found
[here][pytest-selenium].

[git-clone]: https://help.github.com/articles/cloning-a-repository/
[git-fork]: https://help.github.com/articles/fork-a-repo/
[geckodriver]: https://developer.mozilla.org/en-US/docs/Mozilla/QA/Marionette/WebDriver#Setting_up_the_Marionette_executable
[pytest-selenium]: http://pytest-selenium.readthedocs.org/
[virtualenv]: https://wiki.mozilla.org/QA/Execution/Web_Testing/Automation/Virtual_Environments
