class Backend {
  static type = 'backend';

  constructor(services, options = {}) {
    this.init(services, options);
    this.type = 'backend';
  }

  init(services, options = {}) {
    this.services = services;
    this.options = { ...getDefaults(), ...this.options, ...options };
  }

  read(language, namespace, callback) {
    let loadPath = typeof this.options.loadPath === 'function'
      ? this.options.loadPath([language], [namespace])
      : this.options.loadPath;

    const url = this.services.interpolator.interpolate(loadPath, { lng: language, ns: namespace });
    this.loadUrl(url, callback);
  }

  loadUrl(url, callback) {
    this.options.ajax(url, this.options, (data, xhr) => {
      if (xhr.status >= 500 && xhr.status < 600) return callback(`failed loading ${url}`, true);
      if (xhr.status >= 400 && xhr.status < 500) return callback(`failed loading ${url}`, false);

      let ret, err;
      try {
        ret = this.options.parse(data, url);
      } catch (e) {
        err = `failed parsing ${url} to json`;
      }
      if (err) return callback(err, false);
      callback(null, ret);
    });
  }

  create(languages, namespace, key, fallbackValue) {
    if (typeof languages === 'string') languages = [languages];

    const payload = { [key]: fallbackValue || '' };
    languages.forEach(lng => {
      const url = this.services.interpolator.interpolate(this.options.addPath, { lng, ns: namespace });
      this.options.ajax(url, this.options, (data, xhr) => {
        // TODO: Handle response
      }, payload);
    });
  }
}

export default Backend;

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    return function (obj) { return typeof obj; };
  } else {
    return function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }
}

function _toPropertyKey(arg) {
  const key = _toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
}

function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  const prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    const res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}

// Assuming utils.js is still relevant and imported as is.
import * as utils from './utils.js';
import ajax from './ajax.js';
import ftl2js from 'fluent_conv/esm/ftl2js';

function getDefaults() {
  return {
    loadPath: '/locales/{{lng}}/{{ns}}.ftl',
    addPath: '/locales/add/{{lng}}/{{ns}}',
    parse: data => ftl2js(data),
    crossDomain: false,
    ajax
  };
}
