#
# Build
#
FROM node:16-slim AS builder

WORKDIR /srv/node
COPY package.json yarn.lock /srv/node/

RUN yarn install --pure-lockfile

#
# Install
#
FROM node:16-slim

ARG olympia_uid=9500
ARG app_dir=/app

RUN useradd -u ${olympia_uid} -d /home/olympia -m -s /sbin/nologin olympia
# The WORKDIR directive set the ownership of the work directory to root instead
# of USER unless the "buildkit" feature is enabled. To make sure the work
# directory is owned by the proper user for everybody, we manually set the
# ownership.
RUN mkdir -p ${app_dir} && chown ${olympia_uid}:${olympia_uid} ${app_dir}

USER ${olympia_uid}:${olympia_uid}

WORKDIR ${app_dir}

COPY --chown=${olympia_uid}:${olympia_uid} . ${app_dir}/

# Replace the local node_modules with the ones we installed above.
RUN rm -rf node_modules
COPY --from=builder --chown=${olympia_uid}:${olympia_uid} /srv/node/node_modules ${app_dir}/node_modules

ENV SERVER_HOST 0.0.0.0
ENV SERVER_PORT 4000

CMD yarn start
