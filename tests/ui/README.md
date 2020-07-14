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

### Edit your hosts file
These tests rely on the url `https://example.com`. You must add a hostname alias to your /etc/hosts

```bash
echo '127.0.0.1 example.com' | sudo tee -a /etc/hosts
```

### Run the tests
The tests must be run in Firefox 57 or later.

1. Install [Tox]
1. Download geckodriver [v0.21.0][geckodriver] and ensure it's executable and
   in your path
1. Make sure you have [docker][] installed and start the server with
   `yarn start-func-test-server`
1. Run `tox`

The pytest plugin that we use for running tests has a number of advanced
command line options available. To see the options available, run
`pytest --help`. The full documentation for the plugin can be found
[here][pytest-selenium].

[docker]: https://www.docker.com/
[git-clone]: https://help.github.com/articles/cloning-a-repository/
[git-fork]: https://help.github.com/articles/fork-a-repo/
[geckodriver]: https://github.com/mozilla/geckodriver/releases/tag/v0.21.0
[pytest-selenium]: http://pytest-selenium.readthedocs.org/
[Tox]: http://tox.readthedocs.io/
