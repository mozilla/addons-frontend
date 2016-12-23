module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n!=1);",
        lang:"mk" },
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
//! locale : Macedonian [mk]
//! author : Borislav Mickov : https://github.com/B0k0

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var mk = moment.defineLocale('mk', {
    months : 'јануари_февруари_март_април_мај_јуни_јули_август_септември_октомври_ноември_декември'.split('_'),
    monthsShort : 'јан_фев_мар_апр_мај_јун_јул_авг_сеп_окт_ное_дек'.split('_'),
    weekdays : 'недела_понеделник_вторник_среда_четврток_петок_сабота'.split('_'),
    weekdaysShort : 'нед_пон_вто_сре_чет_пет_саб'.split('_'),
    weekdaysMin : 'нe_пo_вт_ср_че_пе_сa'.split('_'),
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'D.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY H:mm',
        LLLL : 'dddd, D MMMM YYYY H:mm'
    },
    calendar : {
        sameDay : '[Денес во] LT',
        nextDay : '[Утре во] LT',
        nextWeek : '[Во] dddd [во] LT',
        lastDay : '[Вчера во] LT',
        lastWeek : function () {
            switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[Изминатата] dddd [во] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[Изминатиот] dddd [во] LT';
            }
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : 'после %s',
        past : 'пред %s',
        s : 'неколку секунди',
        m : 'минута',
        mm : '%d минути',
        h : 'час',
        hh : '%d часа',
        d : 'ден',
        dd : '%d дена',
        M : 'месец',
        MM : '%d месеци',
        y : 'година',
        yy : '%d години'
    },
    ordinalParse: /\d{1,2}-(ев|ен|ти|ви|ри|ми)/,
    ordinal : function (number) {
        var lastDigit = number % 10,
            last2Digits = number % 100;
        if (number === 0) {
            return number + '-ев';
        } else if (last2Digits === 0) {
            return number + '-ен';
        } else if (last2Digits > 10 && last2Digits < 20) {
            return number + '-ти';
        } else if (lastDigit === 1) {
            return number + '-ви';
        } else if (lastDigit === 2) {
            return number + '-ри';
        } else if (lastDigit === 7 || lastDigit === 8) {
            return number + '-ми';
        } else {
            return number + '-ти';
        }
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

return mk;

})));

} }