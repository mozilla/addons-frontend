#!/usr/bin/env sh
set -x

# Locally build the frontend image docker-compose will pick, that's what we
# want to test. We do that before cloning addons-server to avoid copying the
# contents of that repo, since we copy from `.` when building the image.
docker build . -t mozilla/addons-frontend:latest

# Clone and initialize addons-server for ui tests
git clone --depth 1 https://github.com/mozilla/addons-server.git

cd addons-server
# Emulate initialization, but without doing it completely since setup-ui-tests
# would do what it needs later on.
make up
docker compose ps
# At this point olympia user should have the correct UID/GID and we can use it
# to run the setup.
docker compose exec --user olympia web make update_assets
docker compose exec --user olympia web make setup-ui-tests
docker compose stop nginx
make docker_compose_up

cd -
