const text = addonRatingCount
  ? i18n.t(
      i18n.ngettext(
        '%(total)s Star',
        '%(total)s Stars',
        roundedAverage,
      ),
      {
        total: i18n.formatNumber(roundedAverage),
      },
    )
  : i18n.gettext('Not rated yet');
