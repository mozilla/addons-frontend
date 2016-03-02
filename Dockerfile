FROM centos:centos7

ADD docker/nodesource.gpg.key /etc/pki/rpm-gpg/RPM-GPG-KEY-nodesource
ADD docker/nodesource.repo /etc/yum.repos.d/nodesource.repo

RUN yum update -y \
    && yum install -y nodejs \
    && yum clean all

# Install node_modules into a different directory to avoid npm/npm#9863.
RUN mkdir -p /srv/node
ADD package.json /srv/node
WORKDIR /srv/node
RUN npm install -g npm@3
RUN npm install

ADD . /srv/code
WORKDIR /srv/code

# Replace the local node_modules with the ones we installed above.
RUN rm -rf node_modules
RUN ln -s /srv/node/node_modules

RUN npm run build

ENV SERVER_HOST 0.0.0.0
ENV SERVER_PORT 4000

CMD npm start
