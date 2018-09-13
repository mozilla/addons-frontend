# Building and running services

The following are scripts that are used in deployment - you generally won't need unless you're testing something related to deployment or builds.

The env vars are:

`NODE_APP_INSTANCE` this is the name of the app e.g. 'disco' `NODE_ENV` this is the node environment. e.g. production, dev, stage, development.

| Script     | Description                                    |
| ---------- | ---------------------------------------------- |
| yarn start | Starts the express server (requires env vars)  |
| yarn build | Builds the libs (all apps) (requires env vars) |

**Example:** Building and running a production instance of the AMO app:

```
NODE_APP_INSTANCE=amo NODE_ENV=production yarn build
NODE_APP_INSTANCE=amo NODE_ENV=production yarn start
```

**Note: To run the app locally in production mode you'll need to create a config file for local production builds.** It must be saved as `config/local-production-amo.js` and should look like:

```js
import { apiStageHost, amoStageCDN } from './lib/shared';

module.exports = {
  // Statics will be served by node.
  staticHost: '',
  // FIXME: sign-in isn't working.
  // fxaConfig: 'local',

  // The node server host and port.
  serverHost: '127.0.0.1',
  serverPort: 3000,

  enableClientConsole: true,
  apiHost: apiStageHost,
  amoCDN: amoStageCDN,

  CSP: {
    directives: {
      connectSrc: [apiStageHost],
      scriptSrc: ["'self'", 'https://www.google-analytics.com'],
      styleSrc: ["'self'"],
      imgSrc: [
        "'self'",
        'data:',
        amoStageCDN,
        'https://www.google-analytics.com',
      ],
      mediaSrc: ["'self'"],
      fontSrc: ["'self'", 'data:', amoStageCDN],
    },
  },

  // This is needed to serve assets locally.
  enableNodeStatics: true,
  trackingEnabled: false,
  // Do not send client side errors to Sentry.
  publicSentryDsn: null,
};
```

After this, re-build and restart using `yarn build` and `yarn start` as documented above. If you have used `localhost` before with a different configuration, be sure to clear your cookies.

**NOTE**: At this time, it's not possible to sign in using this approach.
