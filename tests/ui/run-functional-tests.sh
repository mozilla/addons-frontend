#!/usr/bin/env sh
git clone --depth 1 https://github.com/mozilla/addons-server.git
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml up -d --build
until docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml images | grep "addonsserver_addons-frontend_1" ;
    do printf "."; sleep 1
done
echo
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml ps
# Make sure dependencies get updated in worker and web container
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec worker make -f Makefile-docker update_deps
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml restart worker
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec web make -f Makefile-docker update_deps
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml restart web
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec --user root selenium-firefox tox -e ui-tests
