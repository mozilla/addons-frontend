// Create UTC creation date in the correct format.
const potCreationDate = new Date()
  .toISOString()
  .replace('T', ' ')
  .replace(/:\d{2}.\d{3}Z/, '+0000');

module.exports = {
  extends: './babel.config.js',
  plugins: [
    [
      'module:babel-gettext-extractor',
      {
        headers: {
          'Project-Id-Version': 'amo',
          'Report-Msgid-Bugs-To': 'EMAIL@ADDRESS',
          'POT-Creation-Date': potCreationDate,
          'PO-Revision-Date': 'YEAR-MO-DA HO:MI+ZONE',
          'Last-Translator': 'FULL NAME <EMAIL@ADDRESS>',
          'Language-Team': 'LANGUAGE <LL@li.org>',
          'MIME-Version': '1.0',
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Transfer-Encoding': '8bit',
          'plural-forms': 'nplurals=2; plural=(n!=1);',
        },
        functionNames: {
          gettext: ['msgid'],
          dgettext: ['domain', 'msgid'],
          ngettext: ['msgid', 'msgid_plural', 'count'],
          dngettext: ['domain', 'msgid', 'msgid_plural', 'count'],
          pgettext: ['msgctxt', 'msgid'],
          dpgettext: ['domain', 'msgctxt', 'msgid'],
          npgettext: ['msgctxt', 'msgid', 'msgid_plural', 'count'],
          dnpgettext: ['domain', 'msgctxt', 'msgid', 'msgid_plural', 'count'],
        },
        fileName: './locale/templates/LC_MESSAGES/amo.pot',
        baseDirectory: process.cwd(),
        stripTemplateLiteralIndent: true,
      },
    ],
  ],
};
