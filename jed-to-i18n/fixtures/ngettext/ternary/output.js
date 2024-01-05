const header =
  /*manual-change: merge keys 
'three' -> 'three_one'
'four' -> 'three_other'*/
  /*manual-change: merge keys 
'one' -> 'one_one'
'two' -> 'one_other'*/
  showMore
    ? i18n.t('one', {
        count: authorIds.length,
        author: authorDisplayName,
      })
    : i18n.t('three', {
        count: authorIds.length,
        author: authorDisplayName,
      });
