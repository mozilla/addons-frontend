module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"fi" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "" ],
      "Extension Metadata":[ "" ],
      Screenshots:[ "" ],
      "About this extension":[ "" ],
      "Rate your experience":[ "" ],
      Category:[ "" ],
      "Used by":[ "" ],
      Sentiment:[ "" ],
      Back:[ "" ],
      Submit:[ "" ],
      "Please enter some text":[ "" ],
      "Write a review":[ "" ],
      "Tell the world why you think this extension is fantastic!":[ "" ],
      "Privacy policy":[ "" ],
      "Legal notices":[ "" ],
      "View desktop site":[ "" ],
      "Browse in your language":[ "" ],
      "Firefox Add-ons":[ "" ],
      "How are you enjoying your experience with %(addonName)s?":[ "" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "" ],
      "Average rating: %(rating)s out of 5":[ "" ],
      "No ratings":[ "" ],
      "%(users)s user":[ "",
        "%(users)s users" ],
      "Log out":[ "" ],
      "Log in/Sign up":[ "" ],
      "Add-ons for Firefox":[ "" ],
      "What do you want Firefox to do?":[ "" ],
      "Block ads":[ "" ],
      Screenshot:[ "" ],
      "Save stuff":[ "" ],
      "Shop online":[ "" ],
      "Be social":[ "" ],
      "Share stuff":[ "" ],
      "Browse all extensions":[ "" ],
      "How do you want Firefox to look?":[ "" ],
      Wild:[ "" ],
      Abstract:[ "" ],
      Fashionable:[ "" ],
      Scenic:[ "" ],
      Sporty:[ "" ],
      Mystical:[ "" ],
      "Browse all themes":[ "" ],
      "Downloading %(name)s.":[ "" ],
      "Installing %(name)s.":[ "" ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "" ],
      "%(name)s is disabled. Click to enable.":[ "" ],
      "Uninstalling %(name)s.":[ "" ],
      "%(name)s is uninstalled. Click to install.":[ "" ],
      "Install state for %(name)s is unknown.":[ "" ],
      Previous:[ "" ],
      Next:[ "" ],
      "Page %(currentPage)s of %(totalPages)s":[ "" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "",
        "Your search for \"%(query)s\" returned %(count)s results." ],
      "Searching...":[ "" ],
      "No results were found for \"%(query)s\".":[ "" ],
      "Please supply a valid search":[ "" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Finnish [fi]
//! author : Tarmo Aidantausta : https://github.com/bleadof

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var numbersPast = 'nolla yksi kaksi kolme neljä viisi kuusi seitsemän kahdeksan yhdeksän'.split(' ');
var numbersFuture = [
        'nolla', 'yhden', 'kahden', 'kolmen', 'neljän', 'viiden', 'kuuden',
        numbersPast[7], numbersPast[8], numbersPast[9]
    ];
function translate(number, withoutSuffix, key, isFuture) {
    var result = '';
    switch (key) {
        case 's':
            return isFuture ? 'muutaman sekunnin' : 'muutama sekunti';
        case 'm':
            return isFuture ? 'minuutin' : 'minuutti';
        case 'mm':
            result = isFuture ? 'minuutin' : 'minuuttia';
            break;
        case 'h':
            return isFuture ? 'tunnin' : 'tunti';
        case 'hh':
            result = isFuture ? 'tunnin' : 'tuntia';
            break;
        case 'd':
            return isFuture ? 'päivän' : 'päivä';
        case 'dd':
            result = isFuture ? 'päivän' : 'päivää';
            break;
        case 'M':
            return isFuture ? 'kuukauden' : 'kuukausi';
        case 'MM':
            result = isFuture ? 'kuukauden' : 'kuukautta';
            break;
        case 'y':
            return isFuture ? 'vuoden' : 'vuosi';
        case 'yy':
            result = isFuture ? 'vuoden' : 'vuotta';
            break;
    }
    result = verbalNumber(number, isFuture) + ' ' + result;
    return result;
}
function verbalNumber(number, isFuture) {
    return number < 10 ? (isFuture ? numbersFuture[number] : numbersPast[number]) : number;
}

var fi = moment.defineLocale('fi', {
    months : 'tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesäkuu_heinäkuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu'.split('_'),
    monthsShort : 'tammi_helmi_maalis_huhti_touko_kesä_heinä_elo_syys_loka_marras_joulu'.split('_'),
    weekdays : 'sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai'.split('_'),
    weekdaysShort : 'su_ma_ti_ke_to_pe_la'.split('_'),
    weekdaysMin : 'su_ma_ti_ke_to_pe_la'.split('_'),
    longDateFormat : {
        LT : 'HH.mm',
        LTS : 'HH.mm.ss',
        L : 'DD.MM.YYYY',
        LL : 'Do MMMM[ta] YYYY',
        LLL : 'Do MMMM[ta] YYYY, [klo] HH.mm',
        LLLL : 'dddd, Do MMMM[ta] YYYY, [klo] HH.mm',
        l : 'D.M.YYYY',
        ll : 'Do MMM YYYY',
        lll : 'Do MMM YYYY, [klo] HH.mm',
        llll : 'ddd, Do MMM YYYY, [klo] HH.mm'
    },
    calendar : {
        sameDay : '[tänään] [klo] LT',
        nextDay : '[huomenna] [klo] LT',
        nextWeek : 'dddd [klo] LT',
        lastDay : '[eilen] [klo] LT',
        lastWeek : '[viime] dddd[na] [klo] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s päästä',
        past : '%s sitten',
        s : translate,
        m : translate,
        mm : translate,
        h : translate,
        hh : translate,
        d : translate,
        dd : translate,
        M : translate,
        MM : translate,
        y : translate,
        yy : translate
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return fi;

})));

} }