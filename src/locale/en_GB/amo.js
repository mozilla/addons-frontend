module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"en_GB" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Extension Metadata" ],
      Screenshots:[ "Screenshots" ],
      "About this extension":[ "About this extension" ],
      "Rate your experience":[ "Rate your experience" ],
      Category:[ "Category" ],
      "Used by":[ "Used by" ],
      Sentiment:[ "Sentiment" ],
      Back:[ "Back" ],
      Submit:[ "Submit" ],
      "Please enter some text":[ "Please enter some text" ],
      "Write a review":[ "Write a review" ],
      "Tell the world why you think this extension is fantastic!":[ "Tell the world why you think this extension is fantastic!" ],
      "Privacy policy":[ "Privacy policy" ],
      "Legal notices":[ "Legal notices" ],
      "View desktop site":[ "View desktop site" ],
      "Browse in your language":[ "Browse in your language" ],
      "Firefox Add-ons":[ "Firefox Add-ons" ],
      "How are you enjoying your experience with %(addonName)s?":[ "How are you enjoying your experience with %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "screenshot %(imageNumber)s of %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Average rating: %(rating)s out of 5" ],
      "No ratings":[ "No ratings" ],
      "%(users)s user":[ "%(users)s user",
        "%(users)s users" ],
      "Log out":[ "Log out" ],
      "Log in/Sign up":[ "Log in/Sign up" ],
      "Add-ons for Firefox":[ "Add-ons for Firefox" ],
      "What do you want Firefox to do?":[ "What do you want Firefox to do?" ],
      "Block ads":[ "Block ads" ],
      Screenshot:[ "Screenshot" ],
      "Save stuff":[ "Save stuff" ],
      "Shop online":[ "Shop online" ],
      "Be social":[ "Be social" ],
      "Share stuff":[ "Share stuff" ],
      "Browse all extensions":[ "Browse all extensions" ],
      "How do you want Firefox to look?":[ "How do you want Firefox to look?" ],
      Wild:[ "Wild" ],
      Abstract:[ "Abstract" ],
      Fashionable:[ "Fashionable" ],
      Scenic:[ "Scenic" ],
      Sporty:[ "Sporty" ],
      Mystical:[ "Mystical" ],
      "Browse all themes":[ "Browse all themes" ],
      "Downloading %(name)s.":[ "Downloading %(name)s." ],
      "Installing %(name)s.":[ "Installing %(name)s." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s is installed and enabled. Click to uninstall." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s is disabled. Click to enable." ],
      "Uninstalling %(name)s.":[ "Uninstalling %(name)s." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s is uninstalled. Click to install." ],
      "Install state for %(name)s is unknown.":[ "Install state for %(name)s is unknown." ],
      Previous:[ "Previous" ],
      Next:[ "Next" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Page %(currentPage)s of %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Your search for \"%(query)s\" returned %(count)s result.",
        "Your search for \"%(query)s\" returned %(count)s results." ],
      "Searching...":[ "Searching..." ],
      "No results were found for \"%(query)s\".":[ "No results were found for \"%(query)s\"." ],
      "Please supply a valid search":[ "Please supply a valid search" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : English (United Kingdom) [en-gb]
//! author : Chris Gedrim : https://github.com/chrisgedrim

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var enGb = moment.defineLocale('en-gb', {
    months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
    monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
    weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
    weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
    weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'in %s',
        past : '%s ago',
        s : 'a few seconds',
        m : 'a minute',
        mm : '%d minutes',
        h : 'an hour',
        hh : '%d hours',
        d : 'a day',
        dd : '%d days',
        M : 'a month',
        MM : '%d months',
        y : 'a year',
        yy : '%d years'
    },
    ordinalParse: /\d{1,2}(st|nd|rd|th)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (~~(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return enGb;

})));

} }