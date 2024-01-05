/*manual-change: merge keys 
'%(total)s user' -> '%(total)s user_one'
'%(total)s users' -> '%(total)s user_other'*/
i18n.t('%(total)s user', {
  count: 1,
  total: i18n.formatNumber(1),
});
