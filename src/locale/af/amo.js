module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n!=1);",
        lang:"af" },
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
//! locale : Afrikaans [af]
//! author : Werner Mollentze : https://github.com/wernerm

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var af = moment.defineLocale('af', {
    months : 'Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember'.split('_'),
    monthsShort : 'Jan_Feb_Mrt_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des'.split('_'),
    weekdays : 'Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag'.split('_'),
    weekdaysShort : 'Son_Maa_Din_Woe_Don_Vry_Sat'.split('_'),
    weekdaysMin : 'So_Ma_Di_Wo_Do_Vr_Sa'.split('_'),
    meridiemParse: /vm|nm/i,
    isPM : function (input) {
        return /^nm$/i.test(input);
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours < 12) {
            return isLower ? 'vm' : 'VM';
        } else {
            return isLower ? 'nm' : 'NM';
        }
    },
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[Vandag om] LT',
        nextDay : '[Môre om] LT',
        nextWeek : 'dddd [om] LT',
        lastDay : '[Gister om] LT',
        lastWeek : '[Laas] dddd [om] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'oor %s',
        past : '%s gelede',
        s : '\'n paar sekondes',
        m : '\'n minuut',
        mm : '%d minute',
        h : '\'n uur',
        hh : '%d ure',
        d : '\'n dag',
        dd : '%d dae',
        M : '\'n maand',
        MM : '%d maande',
        y : '\'n jaar',
        yy : '%d jaar'
    },
    ordinalParse: /\d{1,2}(ste|de)/,
    ordinal : function (number) {
        return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de'); // Thanks to Joris Röling : https://github.com/jjupiter
    },
    week : {
        dow : 1, // Maandag is die eerste dag van die week.
        doy : 4  // Die week wat die 4de Januarie bevat is die eerste week van die jaar.
    }
});

return af;

})));

} }