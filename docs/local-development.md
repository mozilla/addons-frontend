# Local development

## Running AMO for local development

A proxy server is provided for running the AMO app with the API on the same host as the frontend. This provides a setup that is closer to production than running the frontend on its own. The default configuration for this is to use a local addons-server for the API which can be setup according to the [addons-server docs](https://addons-server.readthedocs.io/en/latest/topics/install/index.html). Docker is the preferred method of running addons-server.

Authentication will work when initiated from addons-frontend and will persist to addons-server but it will not work when logging in from an addons-server page. See [mozilla/addons-server#4684](https://github.com/mozilla/addons-server/issues/4684) for more information on fixing this.

If you would like to use `https://addons-dev.allizom.org` for data you should use the `yarn amo:dev` command. See the table of commands up above for similar hosted options.

### Local configuration

If you need to override any settings while running `yarn amo`, `yarn amo:dev`, or `yarn amo:stage`, first create a local config file named exactly like this:

    touch config/local-development-amo.js

Make any config changes. For example:

```javascript
module.exports = {
  trackingEnabled: true,
};
```

Restart the server to see it take affect.

Consult the [config file loading order docs](https://github.com/lorenwest/node-config/wiki/Configuration-Files#file-load-order) to learn more about how configuration is applied.

## Running the Discopane for local development

When running `yarn disco`, your local server will be configured for a hosted development API. If you want to run your own [addons-server](https://github.com/mozilla/addons-server) API or make any other local changes, you'll need to create a custom config file named exactly like this:

    touch config/local-development-disco.js

Here's what `local-development-disco.js` would look like when overriding the `apiHost` parameter so that it points to your docker container:

```javascript
module.exports = {
  apiHost: 'http://olympia.test',
};
```

Restart the server to see it take affect.

## Configuring an Android device for local development

If you want to access your local server on an Android device you will need to change a few settings. Let's say your local machine is accessible on your network at the IP address `10.0.0.1`. You could start your server like this:

```
API_HOST=http://10.0.0.1:3000 \
    SERVER_HOST=10.0.0.1 \
    WEBPACK_SERVER_HOST=10.0.0.1 \
    yarn amo:dev
```

On your Android device, you could then access the development site at `http://10.0.0.1:3000`.

**NOTE**: At this time, it is not possible to sign in with this configuration because the Firefox Accounts client redirects to `localhost:3000`. You may be able to try a different approach by editing `/etc/hosts` on your device so that `localhost` points to your development machine but this has not been fully tested.

## Disabling CSP for local development

When developing locally with a webpack server, the randomly generated asset URL will fail our Content Security Policy (CSP) and clutter your console with errors. You can turn off all CSP errors by settings CSP to `false` in any local config file, such as `local-development-amo.js`. Example:

```javascript
module.exports = {
  CSP: false,
};
```
