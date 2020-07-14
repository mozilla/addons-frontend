#!/usr/bin/env sh
set -x
git clone --depth 1 https://github.com/mozilla/addons-server.git
docker build -f addons-server/Dockerfile --build-arg GROUP_ID=$(id -g) --build-arg USER_ID=$(id -u) -t addons/addons-server:latest addons-server/
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml up -d --build
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml ps
sudo chown -R  $USER:$USER .
# Make sure dependencies get updated in worker and web container
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec worker make -f Makefile-docker update_deps update_assets
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml restart worker
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec web make -f Makefile-docker update_deps update_assets
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml restart web
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec web make setup-ui-tests
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml stop nginx
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml up -d