module.exports = {
  CSP: {
    directives: {
      // The location object in about:addons has '' for hostname and
      // a value of `about:addons` for `frame-ancestors` is still blocked.
      // However, the protocol in the location object is `about:`
      // and with just `about:` as the value for frame-ancestors
      // about:addons can iframe the disco pane.
      frameAncestors: ['about:'],
    },
  },
};
