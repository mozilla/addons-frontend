module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n!=1);",
        lang:"eu" },
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
//! locale : Basque [eu]
//! author : Eneko Illarramendi : https://github.com/eillarra

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var eu = moment.defineLocale('eu', {
    months : 'urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua'.split('_'),
    monthsShort : 'urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.'.split('_'),
    monthsParseExact : true,
    weekdays : 'igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata'.split('_'),
    weekdaysShort : 'ig._al._ar._az._og._ol._lr.'.split('_'),
    weekdaysMin : 'ig_al_ar_az_og_ol_lr'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'YYYY-MM-DD',
        LL : 'YYYY[ko] MMMM[ren] D[a]',
        LLL : 'YYYY[ko] MMMM[ren] D[a] HH:mm',
        LLLL : 'dddd, YYYY[ko] MMMM[ren] D[a] HH:mm',
        l : 'YYYY-M-D',
        ll : 'YYYY[ko] MMM D[a]',
        lll : 'YYYY[ko] MMM D[a] HH:mm',
        llll : 'ddd, YYYY[ko] MMM D[a] HH:mm'
    },
    calendar : {
        sameDay : '[gaur] LT[etan]',
        nextDay : '[bihar] LT[etan]',
        nextWeek : 'dddd LT[etan]',
        lastDay : '[atzo] LT[etan]',
        lastWeek : '[aurreko] dddd LT[etan]',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s barru',
        past : 'duela %s',
        s : 'segundo batzuk',
        m : 'minutu bat',
        mm : '%d minutu',
        h : 'ordu bat',
        hh : '%d ordu',
        d : 'egun bat',
        dd : '%d egun',
        M : 'hilabete bat',
        MM : '%d hilabete',
        y : 'urte bat',
        yy : '%d urte'
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

return eu;

})));

} }