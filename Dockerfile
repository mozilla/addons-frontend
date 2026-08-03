#
# Build
#
FROM node:22.22.2-slim AS builder

WORKDIR /srv/node
COPY package.json package-lock.json /srv/node/

RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential ca-certificates git && rm -rf /var/lib/apt/lists/
RUN npm ci

ARG PREBUILD_ENVS=dev,stage,prod
COPY . /srv/node/
RUN PREBUILD_ENVS="${PREBUILD_ENVS}" npm run build:prebuilt

#
# Install
#
FROM node:22.22.2-slim

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

# Bring in the assets built for every environment. bin/select-prebuilt-assets.js
# links the set matching NODE_CONFIG_ENV into place at container start.
COPY --from=builder --chown=${app_uid}:${app_uid} /srv/node/dist-prebuilt ${app_dir}/dist-prebuilt

ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=4000

# Select the prebuilt assets for the target env and start -- no build on boot.
CMD ["npm", "run", "start:prebuilt"]
