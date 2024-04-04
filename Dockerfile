#
# Build
#
FROM node:18.20-slim AS builder

WORKDIR /srv/node
COPY package.json yarn.lock /srv/node/

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates git && rm -rf /var/lib/apt/lists/
RUN yarn install --pure-lockfile

#
# Install
#
FROM node:18.20-slim

ARG app_uid=9500
ARG app_dir=/app

RUN useradd -u ${app_uid} -d /home/app -m -s /sbin/nologin app
# The WORKDIR directive set the ownership of the work directory to root instead
# of USER unless the "buildkit" feature is enabled. To make sure the work
# directory is owned by the proper user for everybody, we manually set the
# ownership.
RUN mkdir -p ${app_dir} && chown ${app_uid}:${app_uid} ${app_dir}

USER ${app_uid}:${app_uid}

WORKDIR ${app_dir}

COPY --chown=${app_uid}:${app_uid} . ${app_dir}/

# Replace the local node_modules with the ones we installed above.
RUN rm -rf node_modules
COPY --from=builder --chown=${app_uid}:${app_uid} /srv/node/node_modules ${app_dir}/node_modules

ENV SERVER_HOST 0.0.0.0
ENV SERVER_PORT 4000

CMD yarn start
