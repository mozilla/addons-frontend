# Addons-Frontend Smoke Tests

A simple smoke test suite for the addons-frontend docker image.

### Prerequisites

Python 3 is recommended but the tests can run on Python 2. You must have `tox` installed either way.

You should also stop any services that may be using the port `3000`.

### Steps

1. Build the docker image from the projects root directory: `docker build -t addons-frontend .`.
2. Run the script `setup_docker.sh` in the `tests/smoke` directory.
3. Run the tox command `tox -e smoke-tests`.

The tests look for a URL of `localhost:3000` so it is also possible to just run `yarn amo:dev` without building the image provided you have followed the correct setup.
