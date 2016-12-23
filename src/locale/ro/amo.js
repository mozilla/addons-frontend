module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=3; plural=n==1 ? 0 : (n==0 || (n%100 > 0 && n%100 < 20)) ? 1 : 2;",
        lang:"ro" },
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
        "%(users)s users",
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
        "Your search for \"%(query)s\" returned %(count)s results.",
        "Your search for \"%(query)s\" returned %(count)s results." ],
      "Searching...":[ "" ],
      "No results were found for \"%(query)s\".":[ "" ],
      "Please supply a valid search":[ "" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Romanian [ro]
//! author : Vlad Gurdiga : https://github.com/gurdiga
//! author : Valentin Agachi : https://github.com/avaly

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


function relativeTimeWithPlural(number, withoutSuffix, key) {
    var format = {
            'mm': 'minute',
            'hh': 'ore',
            'dd': 'zile',
            'MM': 'luni',
            'yy': 'ani'
        },
        separator = ' ';
    if (number % 100 >= 20 || (number >= 100 && number % 100 === 0)) {
        separator = ' de ';
    }
    return number + separator + format[key];
}

var ro = moment.defineLocale('ro', {
    months : 'ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie'.split('_'),
    monthsShort : 'ian._febr._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.'.split('_'),
    monthsParseExact: true,
    weekdays : 'duminică_luni_marți_miercuri_joi_vineri_sâmbătă'.split('_'),
    weekdaysShort : 'Dum_Lun_Mar_Mie_Joi_Vin_Sâm'.split('_'),
    weekdaysMin : 'Du_Lu_Ma_Mi_Jo_Vi_Sâ'.split('_'),
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY H:mm',
        LLLL : 'dddd, D MMMM YYYY H:mm'
    },
    calendar : {
        sameDay: '[azi la] LT',
        nextDay: '[mâine la] LT',
        nextWeek: 'dddd [la] LT',
        lastDay: '[ieri la] LT',
        lastWeek: '[fosta] dddd [la] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'peste %s',
        past : '%s în urmă',
        s : 'câteva secunde',
        m : 'un minut',
        mm : relativeTimeWithPlural,
        h : 'o oră',
        hh : relativeTimeWithPlural,
        d : 'o zi',
        dd : relativeTimeWithPlural,
        M : 'o lună',
        MM : relativeTimeWithPlural,
        y : 'un an',
        yy : relativeTimeWithPlural
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

return ro;

})));

} }