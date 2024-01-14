/*manual-change: merge keys 
'More dictionaries by %(author)s' -> 'More dictionaries by %(author)s_one'
'More dictionaries by these translators' -> 'More dictionaries by %(author)s_other'*/
i18n.t('More dictionaries by %(author)s', {
  count: authorIds.length,
  author: authorDisplayName,
});
