const linkText =
  /*manual-change: merge keys 
'Read %(count)s review' -> 'Read %(count)s review_one'
'Read all %(count)s reviews' -> 'Read %(count)s review_other'*/
  i18n.t('Read %(count)s review', {
    count: count,
    count_prop: i18n.formatNumber(count),
  });
