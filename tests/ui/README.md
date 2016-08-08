# UI Tests for Add-Ons Discovery Pane (discopane)

Thank you for checking out Mozilla's addons-frontend ui test suite.
This repository contains Selenium tests used to test the discovery pane.

## How to run the tests locally

### Clone the repository
If you have cloned this project already then you can skip this, otherwise you'll need to clone this repo using Git.
If you do not know how to clone a GitHub repository, check out this
[help page][git-clone] from GitHub.

If you think you would like to contribute to the tests by writing or maintaining them in the future,
it would be a good idea to create a fork of this repository first, and then clone that.
GitHub also has great instructions for [forking a repository][git-fork].

### Run the tests
Tests are run using tox on the command line. Below are a couple of examples of running the tests:

Before running, ensure the [GeckoDriver executable][geckodriver] (rename to wires) is in your path.

Note: The tests must be run in Firefox 48 or later, and geckodriver (wires) must be 0.9.0.

```bash
$ tox -e ui-tests
```

To run against a different environment, pass in a value for `--base-url`, like so:

```bash
$ tox -e ui-tests -- --base-url https://discovery.addons.mozilla.org
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
