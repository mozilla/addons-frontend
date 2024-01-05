i18n.ngettext(
  i18n.sprintf(i18n.gettext('More dictionaries by %(author)s'), {
    author: authorDisplayName,
  }),
  i18n.gettext('More dictionaries by these translators'),
  authorIds.length,
);
