#!/usr/bin/env sh
set -x
sudo sysctl -w vm.max_map_count=262144
# Install UUID for fxa email accounts
sudo apt-get update -qqy && sudo apt-get -qqy install uuid
# Only run homepage and search tests
export UITEST_FXA_EMAIL=uitest-$(uuid)@restmail.net
git clone --depth 1 https://github.com/mozilla/addons-server.git
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml pull --quiet
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml up -d --build
# Wait for server to start
until docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml images | grep "addons-server_addons-frontend_1" ;
    do printf "."; sleep 1
done
echo
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml ps
# Make sure dependencies get updated in worker and web container
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml exec worker make -f Makefile-docker update_deps update_assets
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml restart worker
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml exec web make -f Makefile-docker update_deps update_assets
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml restart web
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml exec selenium-firefox sudo usermod -u 1001 seluser
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml exec web make setup-ui-tests
# This is done because cirlceci has permissions to not allow the user `circleci` to remove or add files created by the root, even if it is part of the root group.
sudo chown -R  $USER:$USER .
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml up -d
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml exec selenium-firefox sudo chown -R seluser:seluser .
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml exec -T web make -f Makefile-docker run-auto-approve &
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml exec selenium-firefox tox -r -e ui-tests
