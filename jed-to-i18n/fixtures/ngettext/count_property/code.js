const linkText = i18n.sprintf(
  i18n.ngettext(
    'Read %(count)s review',
    'Read all %(count)s reviews',
    count,
  ),
  { count: i18n.formatNumber(count) },
);
