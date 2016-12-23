module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2;",
        lang:"sk" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)s od %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Metadáta rozšírenia" ],
      Screenshots:[ "Snímky obrazovky" ],
      "About this extension":[ "O tomto rozšírení" ],
      "Rate your experience":[ "Ohodnoťte svoju skúsenosť" ],
      Category:[ "Kategória" ],
      "Used by":[ "Používa" ],
      Sentiment:[ "Sentiment" ],
      Back:[ "Naspäť" ],
      Submit:[ "Odoslať" ],
      "Please enter some text":[ "Zadajte, prosím, nejaký text" ],
      "Write a review":[ "Napísať recenziu" ],
      "Tell the world why you think this extension is fantastic!":[ "Povedzte svetu, prečo si myslíte, že je toto rozšírenie úžasné!" ],
      "Privacy policy":[ "Zásady ochrany súkromia" ],
      "Legal notices":[ "Právne informácie" ],
      "View desktop site":[ "Zobraziť verziu stránky pre počítače" ],
      "Browse in your language":[ "Prehliadanie vo vašom jazyku" ],
      "Firefox Add-ons":[ "Doplnky pre Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Ako si užívate používanie doplnku %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "snímka obrazovky %(imageNumber)s z %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Priemerné hodnotenie %(rating)s z 5" ],
      "No ratings":[ "Žiadne hodnotenie" ],
      "%(users)s user":[ "%(users)s používateľ",
        "%(users)s používatelia",
        "%(users)s používateľov" ],
      "Log out":[ "Odhlásiť sa" ],
      "Log in/Sign up":[ "Prihlásiť sa/Zaregistrovať sa" ],
      "Add-ons for Firefox":[ "Doplnky pre Firefox" ],
      "What do you want Firefox to do?":[ "Čo chcete, aby váš Firefox dokázal?" ],
      "Block ads":[ "Blokovať reklamy" ],
      Screenshot:[ "Vytvárať snímky obrazovky" ],
      "Save stuff":[ "Ukladať veci" ],
      "Shop online":[ "Nakupovať online" ],
      "Be social":[ "Byť aktívny na sociálnych sieťach" ],
      "Share stuff":[ "Zdielať veci" ],
      "Browse all extensions":[ "Prehliadať všetky rozšírenia" ],
      "How do you want Firefox to look?":[ "Ako chcete, aby váš Firefox vyzeral?" ],
      Wild:[ "Divoko" ],
      Abstract:[ "Abstraktne" ],
      Fashionable:[ "Módne" ],
      Scenic:[ "Malebne" ],
      Sporty:[ "Športovo" ],
      Mystical:[ "Tajomne" ],
      "Browse all themes":[ "Prehliadať všetky témy vzhľadu" ],
      "Downloading %(name)s.":[ "Preberanie doplnku %(name)s." ],
      "Installing %(name)s.":[ "Inštalovanie doplnku %(name)s." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "Doplnok %(name)s je nainštalovaný a povolený. Kliknutím ho odinštalujete." ],
      "%(name)s is disabled. Click to enable.":[ "Doplnok %(name)s je zakázaný. Kliknutím ho povolíte." ],
      "Uninstalling %(name)s.":[ "Odinštalovanie doplnku %(name)s." ],
      "%(name)s is uninstalled. Click to install.":[ "Doplnok %(name)s bol odinštalovaný. Kliknutím ho nainštalujete." ],
      "Install state for %(name)s is unknown.":[ "Stav inštalácie doplnku %(name)s nie je známy." ],
      Previous:[ "Predchádzajúca" ],
      Next:[ "Ďalšia" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Stránka %(currentPage)s z %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Pre vyhľadávaný výraz \"%(query)s\" bol nájdený %(count)s výsledok.",
        "Pre vyhľadávaný výraz \"%(query)s\" boli nájdené %(count)s výsledky.",
        "Pre vyhľadávaný výraz \"%(query)s\" bol nájdených %(count)s výsledkov." ],
      "Searching...":[ "Vyhľadáva sa…" ],
      "No results were found for \"%(query)s\".":[ "Pre vyhľadávaný výraz \"%(query)s\" nebol nájdený žiadny výsledok." ],
      "Please supply a valid search":[ "Prosím, zadajte platný výraz vyhľadávania" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Slovak [sk]
//! author : Martin Minka : https://github.com/k2s
//! based on work of petrbela : https://github.com/petrbela

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var months = 'január_február_marec_apríl_máj_jún_júl_august_september_október_november_december'.split('_');
var monthsShort = 'jan_feb_mar_apr_máj_jún_júl_aug_sep_okt_nov_dec'.split('_');
function plural(n) {
    return (n > 1) && (n < 5);
}
function translate(number, withoutSuffix, key, isFuture) {
    var result = number + ' ';
    switch (key) {
        case 's':  // a few seconds / in a few seconds / a few seconds ago
            return (withoutSuffix || isFuture) ? 'pár sekúnd' : 'pár sekundami';
        case 'm':  // a minute / in a minute / a minute ago
            return withoutSuffix ? 'minúta' : (isFuture ? 'minútu' : 'minútou');
        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'minúty' : 'minút');
            } else {
                return result + 'minútami';
            }
            break;
        case 'h':  // an hour / in an hour / an hour ago
            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
        case 'hh': // 9 hours / in 9 hours / 9 hours ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'hodiny' : 'hodín');
            } else {
                return result + 'hodinami';
            }
            break;
        case 'd':  // a day / in a day / a day ago
            return (withoutSuffix || isFuture) ? 'deň' : 'dňom';
        case 'dd': // 9 days / in 9 days / 9 days ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'dni' : 'dní');
            } else {
                return result + 'dňami';
            }
            break;
        case 'M':  // a month / in a month / a month ago
            return (withoutSuffix || isFuture) ? 'mesiac' : 'mesiacom';
        case 'MM': // 9 months / in 9 months / 9 months ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'mesiace' : 'mesiacov');
            } else {
                return result + 'mesiacmi';
            }
            break;
        case 'y':  // a year / in a year / a year ago
            return (withoutSuffix || isFuture) ? 'rok' : 'rokom';
        case 'yy': // 9 years / in 9 years / 9 years ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'roky' : 'rokov');
            } else {
                return result + 'rokmi';
            }
            break;
    }
}

var sk = moment.defineLocale('sk', {
    months : months,
    monthsShort : monthsShort,
    weekdays : 'nedeľa_pondelok_utorok_streda_štvrtok_piatok_sobota'.split('_'),
    weekdaysShort : 'ne_po_ut_st_št_pi_so'.split('_'),
    weekdaysMin : 'ne_po_ut_st_št_pi_so'.split('_'),
    longDateFormat : {
        LT: 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY H:mm',
        LLLL : 'dddd D. MMMM YYYY H:mm'
    },
    calendar : {
        sameDay: '[dnes o] LT',
        nextDay: '[zajtra o] LT',
        nextWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[v nedeľu o] LT';
                case 1:
                case 2:
                    return '[v] dddd [o] LT';
                case 3:
                    return '[v stredu o] LT';
                case 4:
                    return '[vo štvrtok o] LT';
                case 5:
                    return '[v piatok o] LT';
                case 6:
                    return '[v sobotu o] LT';
            }
        },
        lastDay: '[včera o] LT',
        lastWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[minulú nedeľu o] LT';
                case 1:
                case 2:
                    return '[minulý] dddd [o] LT';
                case 3:
                    return '[minulú stredu o] LT';
                case 4:
                case 5:
                    return '[minulý] dddd [o] LT';
                case 6:
                    return '[minulú sobotu o] LT';
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : 'za %s',
        past : 'pred %s',
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

return sk;

})));

} }