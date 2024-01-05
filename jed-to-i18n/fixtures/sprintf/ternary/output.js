const text = addonRatingCount
  ? /*manual-change: merge keys 
'%(total)s Star' -> '%(total)s Star_one'
'%(total)s Stars' -> '%(total)s Star_other'*/
    i18n.t('%(total)s Star', {
      count: roundedAverage,
      total: i18n.formatNumber(roundedAverage),
    })
  : i18n.t('Not rated yet');
