# Addons-Frontend Smoke Tests

A simple smoke test suite for the addons-frontend docker image.

### Prerequisites

Python 3 is recommended but the tests can run on Python 2. You must have `tox` installed either way.

You should also stop any services that may be using the port `3000`. You will also need to add `olympia.test` to your `/etc/hosts` in line with `127.0.0.1`.

### Steps

1. Run the script `./tests/smoke/setup_docker.sh` and wait for it to exit.
2. Run the tox command `tox -e smoke-tests`.
