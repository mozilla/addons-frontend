module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"el" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)s από %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Μεταδεδομένα επέκτασης" ],
      Screenshots:[ "Στιγμιότυπα" ],
      "About this extension":[ "Σχετικά με την επέκταση" ],
      "Rate your experience":[ "Αξιολογήστε την εμπειρία σας" ],
      Category:[ "Κατηγορία" ],
      "Used by":[ "Χρήση από" ],
      Sentiment:[ "Αίσθηση" ],
      Back:[ "Πίσω" ],
      Submit:[ "Υποβολή" ],
      "Please enter some text":[ "Παρακαλώ εισάγετε κείμενο" ],
      "Write a review":[ "Γράψτε μια κριτική" ],
      "Tell the world why you think this extension is fantastic!":[ "Πείτε στον κόσμο γιατί θεωρείτε ότι αυτή η επέκταση είναι φανταστική!" ],
      "Privacy policy":[ "Πολιτική απορρήτου" ],
      "Legal notices":[ "Νομικές σημειώσεις" ],
      "View desktop site":[ "Προβολή ιστοσελίδας για υπολογιστές" ],
      "Browse in your language":[ "Περιήγηση στη γλώσσα σας" ],
      "Firefox Add-ons":[ "Πρόσθετα Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Απολαμβάνετε την εμπειρία σας με το %(addonName)s;" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "Στιγμιότυπο %(imageNumber)s από %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Μέση βαθμολογία: %(rating)s από 5" ],
      "No ratings":[ "Καμία κριτική" ],
      "%(users)s user":[ "%(users)s χρήστης",
        "%(users)s χρήστες" ],
      "Log out":[ "Αποσύνδεση" ],
      "Log in/Sign up":[ "Σύνδεση/Εγγραφή" ],
      "Add-ons for Firefox":[ "Πρόσθετα για το Firefox" ],
      "What do you want Firefox to do?":[ "Τι θέλετε να κάνει το Firefox;" ],
      "Block ads":[ "Αποκλεισμός διαφημίσεων" ],
      Screenshot:[ "Στιγμιότυπο οθόνης" ],
      "Save stuff":[ "Αποθήκευση στοιχείων" ],
      "Shop online":[ "Διαδικτυακές αγορές" ],
      "Be social":[ "Κοινωνικοποίηση" ],
      "Share stuff":[ "Κοινή χρήση στοιχείων" ],
      "Browse all extensions":[ "Περιήγηση σε όλες τις επεκτάσεις" ],
      "How do you want Firefox to look?":[ "Τι εμφάνιση θέλετε να έχει το Firefox;" ],
      Wild:[ "Άγρια" ],
      Abstract:[ "Αφηρημένη" ],
      Fashionable:[ "Μοδάτη" ],
      Scenic:[ "Σκηνική" ],
      Sporty:[ "Αθλητική" ],
      Mystical:[ "Μυστική" ],
      "Browse all themes":[ "Περιήγηση σε όλα τα θέματα" ],
      "Downloading %(name)s.":[ "Γίνεται λήψη του %(name)s." ],
      "Installing %(name)s.":[ "Γίνεται εγκατάσταση του %(name)s." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "Το %(name)s έχει εγκατασταθεί και ενεργοποιηθεί. Κάντε κλικ για απεγκατάσταση." ],
      "%(name)s is disabled. Click to enable.":[ "Το %(name)s έχει απενεργοποιηθεί. Κάντε κλικ για ενεργοποίηση." ],
      "Uninstalling %(name)s.":[ "Γίνεται απεγκατάσταση του %(name)s." ],
      "%(name)s is uninstalled. Click to install.":[ "Το %(name)s έχει απεγκατασταθεί. Κάντε κλικ για εγκατάσταση." ],
      "Install state for %(name)s is unknown.":[ "Η κατάσταση εγκατάστασης για το %(name)s είναι άγνωστη." ],
      Previous:[ "Προηγούμενη" ],
      Next:[ "Επόμενη" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Σελίδα %(currentPage)s από %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Η αναζήτησή σας για το \"%(query)s\" είχε %(count)s αποτέλεσμα.",
        "Η αναζήτησή σας για το \"%(query)s\" είχε %(count)s αποτελέσματα." ],
      "Searching...":[ "Αναζήτηση..." ],
      "No results were found for \"%(query)s\".":[ "Δεν βρέθηκε κανένα αποτέλεσμα για το \"%(query)s\"." ],
      "Please supply a valid search":[ "Παρακαλώ κάντε μια έγκυρη αναζήτηση" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Greek [el]
//! author : Aggelos Karalias : https://github.com/mehiel

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';

function isFunction(input) {
    return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
}


var el = moment.defineLocale('el', {
    monthsNominativeEl : 'Ιανουάριος_Φεβρουάριος_Μάρτιος_Απρίλιος_Μάιος_Ιούνιος_Ιούλιος_Αύγουστος_Σεπτέμβριος_Οκτώβριος_Νοέμβριος_Δεκέμβριος'.split('_'),
    monthsGenitiveEl : 'Ιανουαρίου_Φεβρουαρίου_Μαρτίου_Απριλίου_Μαΐου_Ιουνίου_Ιουλίου_Αυγούστου_Σεπτεμβρίου_Οκτωβρίου_Νοεμβρίου_Δεκεμβρίου'.split('_'),
    months : function (momentToFormat, format) {
        if (/D/.test(format.substring(0, format.indexOf('MMMM')))) { // if there is a day number before 'MMMM'
            return this._monthsGenitiveEl[momentToFormat.month()];
        } else {
            return this._monthsNominativeEl[momentToFormat.month()];
        }
    },
    monthsShort : 'Ιαν_Φεβ_Μαρ_Απρ_Μαϊ_Ιουν_Ιουλ_Αυγ_Σεπ_Οκτ_Νοε_Δεκ'.split('_'),
    weekdays : 'Κυριακή_Δευτέρα_Τρίτη_Τετάρτη_Πέμπτη_Παρασκευή_Σάββατο'.split('_'),
    weekdaysShort : 'Κυρ_Δευ_Τρι_Τετ_Πεμ_Παρ_Σαβ'.split('_'),
    weekdaysMin : 'Κυ_Δε_Τρ_Τε_Πε_Πα_Σα'.split('_'),
    meridiem : function (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'μμ' : 'ΜΜ';
        } else {
            return isLower ? 'πμ' : 'ΠΜ';
        }
    },
    isPM : function (input) {
        return ((input + '').toLowerCase()[0] === 'μ');
    },
    meridiemParse : /[ΠΜ]\.?Μ?\.?/i,
    longDateFormat : {
        LT : 'h:mm A',
        LTS : 'h:mm:ss A',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY h:mm A',
        LLLL : 'dddd, D MMMM YYYY h:mm A'
    },
    calendarEl : {
        sameDay : '[Σήμερα {}] LT',
        nextDay : '[Αύριο {}] LT',
        nextWeek : 'dddd [{}] LT',
        lastDay : '[Χθες {}] LT',
        lastWeek : function () {
            switch (this.day()) {
                case 6:
                    return '[το προηγούμενο] dddd [{}] LT';
                default:
                    return '[την προηγούμενη] dddd [{}] LT';
            }
        },
        sameElse : 'L'
    },
    calendar : function (key, mom) {
        var output = this._calendarEl[key],
            hours = mom && mom.hours();
        if (isFunction(output)) {
            output = output.apply(mom);
        }
        return output.replace('{}', (hours % 12 === 1 ? 'στη' : 'στις'));
    },
    relativeTime : {
        future : 'σε %s',
        past : '%s πριν',
        s : 'λίγα δευτερόλεπτα',
        m : 'ένα λεπτό',
        mm : '%d λεπτά',
        h : 'μία ώρα',
        hh : '%d ώρες',
        d : 'μία μέρα',
        dd : '%d μέρες',
        M : 'ένας μήνας',
        MM : '%d μήνες',
        y : 'ένας χρόνος',
        yy : '%d χρόνια'
    },
    ordinalParse: /\d{1,2}η/,
    ordinal: '%dη',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4st is the first week of the year.
    }
});

return el;

})));

} }