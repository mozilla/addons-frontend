/* eslint-disable no-param-reassign */
/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');

const { po } = require('gettext-parser');

function convertQtFormatToBracket(str) {
  // Regular expression to match QT format placeholders
  // e.g., "%(variable)s" -> matches and captures "variable"
  const qtFormatRegex = /%\(([^)]+)\)s/g;

  // Replace each match with the bracket-style placeholder
  return str.replace(qtFormatRegex, (match, variableName) => {
    return `{{${variableName}}}`;
  });
}

function sanitizeString(key) {
  return (str) => {
    if (str === '') return key;
    return str;
  };
}

function poToJson(fileName) {
  const buffer = fs.readFileSync(fs.realpathSync(fileName));

  // Parse the PO file
  const parsed = po.parse(buffer, 'utf8');

  const translations = parsed.translations[''];

  // Create gettext/Jed compatible JSON from parsed data
  const result = Object.entries(translations).reduce((acm, [k, t]) => {
    const key = k;
    // process translation strings
    const [one, other] = t.msgstr
      .map(sanitizeString(key))
      .map(convertQtFormatToBracket);

    // replace _plural with _one / _other separate keys
    if (t.msgid_plural) {
      acm[`${key}_other`] = other;
      acm[`${key}_one`] = one;
    } else {
      acm[key] = one;
    }
    return acm;
  }, {});

  return JSON.stringify(result, null, 2);
}

module.exports = poToJson;
