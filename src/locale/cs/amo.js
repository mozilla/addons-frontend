module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2;",
        lang:"cs" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)s od %(authorList)s %(endSpan)s" ],
      "Extension Metadata":[ "Metadata rozšíření" ],
      Screenshots:[ "Snímky obrazovky" ],
      "About this extension":[ "O tomto rozšíření" ],
      "Rate your experience":[ "Ohodnoťte svou zkušenost" ],
      Category:[ "Kategorie" ],
      "Used by":[ "Používá" ],
      Sentiment:[ "Sentimentálně" ],
      Back:[ "Zpět" ],
      Submit:[ "Odeslat" ],
      "Please enter some text":[ "Zadejte prosím nějaký text" ],
      "Write a review":[ "Napsat recenzi" ],
      "Tell the world why you think this extension is fantastic!":[ "Řekněte celému světu, proč si myslíte, že je tenhle doplněk úžasný!" ],
      "Privacy policy":[ "Zásady ochrany soukromí" ],
      "Legal notices":[ "Právní informace" ],
      "View desktop site":[ "Zobrazit verzi pro desktop" ],
      "Browse in your language":[ "Procházet ve vašem jazyce" ],
      "Firefox Add-ons":[ "Doplňky pro Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Jak si užíváte používání doplňku %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "snímek obrazovky %(imageNumber)s/%(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Průměrné hodnocení: %(rating)s z 5" ],
      "No ratings":[ "Nehodnoceno" ],
      "%(users)s user":[ "%(users)s uživatel",
        "%(users)s uživatelé",
        "%(users)s uživatelů" ],
      "Log out":[ "Odhlásit se" ],
      "Log in/Sign up":[ "Přihlásit se / Zaregistrovat se" ],
      "Add-ons for Firefox":[ "Doplňky pro Firefox" ],
      "What do you want Firefox to do?":[ "Co chcete, aby váš Firefox uměl?" ],
      "Block ads":[ "Blokovat reklamy" ],
      Screenshot:[ "Snímek obrazovky" ],
      "Save stuff":[ "Ukládat věci" ],
      "Shop online":[ "Nakupovat online" ],
      "Be social":[ "Být společenský" ],
      "Share stuff":[ "Sdílet věci" ],
      "Browse all extensions":[ "Procházet všechna rozšíření" ],
      "How do you want Firefox to look?":[ "Jak chcete, aby váš Firefox vypadal?" ],
      Wild:[ "Divoce" ],
      Abstract:[ "Abstraktně" ],
      Fashionable:[ "Módně" ],
      Scenic:[ "Malebně" ],
      Sporty:[ "Sportovně" ],
      Mystical:[ "Tajemně" ],
      "Browse all themes":[ "Procházet všechny motivy" ],
      "Downloading %(name)s.":[ "Stahování doplňku %(name)s." ],
      "Installing %(name)s.":[ "Instalace doplňku %(name)s." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "Doplněk %(name)s je nainstalován a povolen. Klepněte pro odinstalaci." ],
      "%(name)s is disabled. Click to enable.":[ "Doplněk %(name)s je zakázán. Klepněte pro povolení." ],
      "Uninstalling %(name)s.":[ "Odinstalace doplňku %(name)s." ],
      "%(name)s is uninstalled. Click to install.":[ "Doplněk %(name)s byl odinstalován. Klepněte pro instalaci." ],
      "Install state for %(name)s is unknown.":[ "Stav instalace doplňku %(name)s není známý." ],
      Previous:[ "Předchozí" ],
      Next:[ "Další" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Stránka %(currentPage)s z %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Na dotaz \"%(query)s\" byl nalezen %(count)s výsledek.",
        "Na dotaz \"%(query)s\" byly nalezeny %(count)s výsledky.",
        "Na dotaz \"%(query)s\" bylo nalezeno %(count)s výsledků." ],
      "Searching...":[ "Vyhledávání…" ],
      "No results were found for \"%(query)s\".":[ "Na dotaz \"%(query)s\" nebyly nalezeny žádné výsledky." ],
      "Please supply a valid search":[ "Zadejte prosím platný vyhledávací dotaz" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Czech [cs]
//! author : petrbela : https://github.com/petrbela

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var months = 'leden_únor_březen_duben_květen_červen_červenec_srpen_září_říjen_listopad_prosinec'.split('_');
var monthsShort = 'led_úno_bře_dub_kvě_čvn_čvc_srp_zář_říj_lis_pro'.split('_');
function plural(n) {
    return (n > 1) && (n < 5) && (~~(n / 10) !== 1);
}
function translate(number, withoutSuffix, key, isFuture) {
    var result = number + ' ';
    switch (key) {
        case 's':  // a few seconds / in a few seconds / a few seconds ago
            return (withoutSuffix || isFuture) ? 'pár sekund' : 'pár sekundami';
        case 'm':  // a minute / in a minute / a minute ago
            return withoutSuffix ? 'minuta' : (isFuture ? 'minutu' : 'minutou');
        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'minuty' : 'minut');
            } else {
                return result + 'minutami';
            }
            break;
        case 'h':  // an hour / in an hour / an hour ago
            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
        case 'hh': // 9 hours / in 9 hours / 9 hours ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'hodiny' : 'hodin');
            } else {
                return result + 'hodinami';
            }
            break;
        case 'd':  // a day / in a day / a day ago
            return (withoutSuffix || isFuture) ? 'den' : 'dnem';
        case 'dd': // 9 days / in 9 days / 9 days ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'dny' : 'dní');
            } else {
                return result + 'dny';
            }
            break;
        case 'M':  // a month / in a month / a month ago
            return (withoutSuffix || isFuture) ? 'měsíc' : 'měsícem';
        case 'MM': // 9 months / in 9 months / 9 months ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'měsíce' : 'měsíců');
            } else {
                return result + 'měsíci';
            }
            break;
        case 'y':  // a year / in a year / a year ago
            return (withoutSuffix || isFuture) ? 'rok' : 'rokem';
        case 'yy': // 9 years / in 9 years / 9 years ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'roky' : 'let');
            } else {
                return result + 'lety';
            }
            break;
    }
}

var cs = moment.defineLocale('cs', {
    months : months,
    monthsShort : monthsShort,
    monthsParse : (function (months, monthsShort) {
        var i, _monthsParse = [];
        for (i = 0; i < 12; i++) {
            // use custom parser to solve problem with July (červenec)
            _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
        }
        return _monthsParse;
    }(months, monthsShort)),
    shortMonthsParse : (function (monthsShort) {
        var i, _shortMonthsParse = [];
        for (i = 0; i < 12; i++) {
            _shortMonthsParse[i] = new RegExp('^' + monthsShort[i] + '$', 'i');
        }
        return _shortMonthsParse;
    }(monthsShort)),
    longMonthsParse : (function (months) {
        var i, _longMonthsParse = [];
        for (i = 0; i < 12; i++) {
            _longMonthsParse[i] = new RegExp('^' + months[i] + '$', 'i');
        }
        return _longMonthsParse;
    }(months)),
    weekdays : 'neděle_pondělí_úterý_středa_čtvrtek_pátek_sobota'.split('_'),
    weekdaysShort : 'ne_po_út_st_čt_pá_so'.split('_'),
    weekdaysMin : 'ne_po_út_st_čt_pá_so'.split('_'),
    longDateFormat : {
        LT: 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY H:mm',
        LLLL : 'dddd D. MMMM YYYY H:mm',
        l : 'D. M. YYYY'
    },
    calendar : {
        sameDay: '[dnes v] LT',
        nextDay: '[zítra v] LT',
        nextWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[v neděli v] LT';
                case 1:
                case 2:
                    return '[v] dddd [v] LT';
                case 3:
                    return '[ve středu v] LT';
                case 4:
                    return '[ve čtvrtek v] LT';
                case 5:
                    return '[v pátek v] LT';
                case 6:
                    return '[v sobotu v] LT';
            }
        },
        lastDay: '[včera v] LT',
        lastWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[minulou neděli v] LT';
                case 1:
                case 2:
                    return '[minulé] dddd [v] LT';
                case 3:
                    return '[minulou středu v] LT';
                case 4:
                case 5:
                    return '[minulý] dddd [v] LT';
                case 6:
                    return '[minulou sobotu v] LT';
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : 'za %s',
        past : 'před %s',
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
    ordinalParse : /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return cs;

})));

} }