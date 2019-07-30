#!/usr/bin/env sh
set -x
git clone --depth 1 https://github.com/mozilla/addons-server.git
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml pull --quiet
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml up -d --build
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml ps
# Make sure dependencies get updated in worker and web container
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec worker make -f Makefile-docker update_deps update_assets
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml restart worker
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec web make -f Makefile-docker update_deps update_assets
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml restart web
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec web make setup-ui-tests
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml stop nginx
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml up -d
# Pull and run selenium firefox docker image
docker run -p 4444:4444 --detach selenium/standalone-firefox