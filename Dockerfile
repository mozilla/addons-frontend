FROM node:6-slim

# Install node_modules into a different directory to avoid npm/npm#9863.
RUN mkdir -p /srv/node
ADD package.json /srv/node/
WORKDIR /srv/node

RUN buildDeps=' \
    git \
    ' && \
    # install deps
    apt-get update -y && \
    apt-get install -y --no-install-recommends $buildDeps && \
	npm update -g npm@3 && \
	npm install && npm cache clean && \
    # cleanup
    # apt-get purge -y $buildDeps && \
    rm -rf /var/lib/apt/lists/*

ADD . /srv/code/
WORKDIR /srv/code

# Replace the local node_modules with the ones we installed above.
RUN rm -rf node_modules
RUN ln -s /srv/node/node_modules

RUN GITREF=$(git rev-parse HEAD) \
GITTAG=$(git name-rev --tags --name-only $GITREF) \
SOURCE='https://github.com/mozilla/addons-frontend' && \
echo "{\"source\": \"$SOURCE\", \
\"version\": \"$GITTAG\", \
\"commit\": \"$GITREF\"}" > version.json

ENV SERVER_HOST 0.0.0.0
ENV SERVER_PORT 4000

CMD npm start
