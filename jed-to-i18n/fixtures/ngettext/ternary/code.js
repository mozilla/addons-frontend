const header = showMore
  ? i18n.ngettext(
      i18n.t('one', {
        author: authorDisplayName,
      }),
      i18n.t('two'),
      authorIds.length,
    )
  : i18n.ngettext(
      i18n.t('three', {
        author: authorDisplayName,
      }),
      i18n.t('four'),
      authorIds.length,
    );
