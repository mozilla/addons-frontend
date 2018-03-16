git clone --depth 1 https://github.com/mozilla/addons-server.git
docker-compose -f addons-server/docker-compose.yml -f docker-compose.override.yml up -d --build
sleep 20
docker-compose -f addons-server/docker-compose.yml -f docker-compose.override.yml ps
# Make sure dependencies get updated in worker and web container
docker-compose -f addons-server/docker-compose.yml -f docker-compose.override.yml exec worker make -f Makefile-docker update_deps
docker-compose -f addons-server/docker-compose.yml -f docker-compose.override.yml restart worker
docker-compose -f addons-server/docker-compose.yml -f docker-compose.override.yml exec web make -f Makefile-docker update_deps
docker-compose -f addons-server/docker-compose.yml -f docker-compose.override.yml restart web
docker-compose -f addons-server/docker-compose.yml -f docker-compose.override.yml exec --user root selenium-firefox tox -e ui-tests
docker-compose -f addons-server/docker-compose.yml -f docker-compose.override.yml stop
