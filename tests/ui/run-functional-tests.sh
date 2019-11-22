#!/usr/bin/env sh
set -ex
# create fxa email
git clone --depth 1 https://github.com/mozilla/addons-server.git
export UITEST_FXA_EMAIL=$(python ./addons-server/tests/ui/scripts/generate_fxa_email.py)
docker build -f addons-server/Dockerfile --build-arg GROUP_ID=$(id -g) --build-arg USER_ID=$(id -u) -t addons/addons-server:latest addons-server/
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml up -d --build
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml ps
sudo chown -R  $USER:$USER .
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
sudo chown -R  $USER:$USER .
docker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml exec -T web make -f Makefile-docker run-auto-approve &
ocker-compose -f addons-server/docker-compose.yml -f addons-server/tests/ui/docker-compose.selenium.yml -f tests/ui/docker-compose.functional-tests.yml exec selenium-firefox tox -r -e ui-tests -- --base-url=http://olympia.test
