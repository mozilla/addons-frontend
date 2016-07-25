import camelCase from 'camelcase';
import config from 'config';

export function gettext(str) {
  return str;
}

export function ngettext(singular, plural, n) {
  if (n === 1) {
    return singular;
  }
  return plural;
}

export function camelCaseProps(obj) {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    newObj[camelCase(key)] = obj[key];
  });
  return newObj;
}

export function getClientConfig(_config) {
  const clientConfig = {};
  for (const key of _config.get('clientConfigKeys')) {
    clientConfig[key] = _config.get(key);
  }
  return clientConfig;
}

export function convertBoolean(value) {
  switch (value) {
    case true:
    case 1:
    case '1':
    case 'true':
      return true;
    default:
      return false;
  }
}

export function getClientApp() {
  // TODO: Look at user-agent header passed in.
  return 'firefox';
}

export function isValidClientApp(value, { _config = config } = {}) {
  return _config.get('validClientApplications').includes(value);
}
