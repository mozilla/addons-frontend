module.exports = {
  CSP: {
    directives: {
      frameAncestors: ['about:addons'],
    },
  },

  // x-frame-options must match frame-ancestors CSP directive.
  frameGuard: {
    action: 'allow-from',
    domain: 'about:addons',
  },
};
