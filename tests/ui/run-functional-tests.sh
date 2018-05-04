#!/usr/bin/env sh
git clone --depth 1 https://github.com/mozilla/addons-server.git
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml up -d --build
until docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml images | grep "addons-server_addons-frontend_1" ;
    do printf "."; sleep 1
done
echo
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml ps
# This script sets the ip of the addons-frontend image as localhost within the selenium-firefox image.
# This MUST be run before any user integration tests.
cd addons-server
UI_IP="`docker inspect addonsserver_addons-frontend_1 | grep "IPAddress" | grep -oE "\b([0-9]{1,3}\.){3}[0-9]{1,3}\b"`"
echo $UI_IP
HOSTS_LINE="$UI_IP\tlocalhost"
cd ..
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec --user root selenium-firefox sudo -- sh -c -e "echo '$HOSTS_LINE' >> /etc/hosts"
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec --user root selenium-firefox cat /etc/hosts
# Make sure dependencies get updated in worker and web container
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec worker make -f Makefile-docker update_deps
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml restart worker
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec web make -f Makefile-docker update_deps
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml restart web
docker-compose -f addons-server/docker-compose.yml -f tests/ui/docker-compose.functional-tests.yml exec --user root selenium-firefox tox -e ui-tests
