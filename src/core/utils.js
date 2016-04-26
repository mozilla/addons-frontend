import camelCase from 'camelcase';

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
