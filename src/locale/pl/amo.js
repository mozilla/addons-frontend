module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);",
        lang:"pl" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)sAutor: %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Metadane rozszerzenia" ],
      Screenshots:[ "Zrzuty ekranu" ],
      "About this extension":[ "O tym rozszerzeniu" ],
      "Rate your experience":[ "Oceń swoje wrażenia" ],
      Category:[ "Kategoria" ],
      "Used by":[ "Używane przez" ],
      Sentiment:[ "Wrażenia" ],
      Back:[ "Wstecz" ],
      Submit:[ "Wyślij" ],
      "Please enter some text":[ "Proszę wpisać jakiś tekst" ],
      "Write a review":[ "Napisz recenzję" ],
      "Tell the world why you think this extension is fantastic!":[ "Powiedz światu, dlaczego to rozszerzenie jest wspaniałe!" ],
      "Privacy policy":[ "Polityka prywatności" ],
      "Legal notices":[ "Kwestie prawne" ],
      "View desktop site":[ "Wyświetl stronę na komputery" ],
      "Browse in your language":[ "Przeglądaj w swoim języku" ],
      "Firefox Add-ons":[ "Dodatki do Firefoksa" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Jak oceniasz swoje wrażenia z rozszerzeniem %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "%(imageNumber)s. zrzut ekranu z %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Średnia ocena: %(rating)s na 5" ],
      "No ratings":[ "Brak ocen" ],
      "%(users)s user":[ "%(users)s użytkownik",
        "%(users)s użytkowników",
        "%(users)s użytkowników" ],
      "Log out":[ "Wyloguj" ],
      "Log in/Sign up":[ "Zaloguj/zarejestruj" ],
      "Add-ons for Firefox":[ "Dodatki do Firefoksa" ],
      "What do you want Firefox to do?":[ "Co chcesz dodać do Firefoksa?" ],
      "Block ads":[ "Blokowanie reklam" ],
      Screenshot:[ "Zrzuty ekranu" ],
      "Save stuff":[ "Zachowywanie rzeczy" ],
      "Shop online":[ "Zakupy w sieci" ],
      "Be social":[ "Sieci społecznościowe" ],
      "Share stuff":[ "Dzielenie się rzeczami" ],
      "Browse all extensions":[ "Wszystkie rozszerzenia" ],
      "How do you want Firefox to look?":[ "Jak Firefox ma wyglądać?" ],
      Wild:[ "Dziko" ],
      Abstract:[ "Abstrakcyjnie" ],
      Fashionable:[ "Modnie" ],
      Scenic:[ "Malowniczo" ],
      Sporty:[ "Sportowo" ],
      Mystical:[ "Mistycznie" ],
      "Browse all themes":[ "Wszystkie motywy" ],
      "Downloading %(name)s.":[ "Pobieranie dodatku „%(name)s”." ],
      "Installing %(name)s.":[ "Instalowanie dodatku „%(name)s”." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "Dodatek „%(name)s” jest zainstalowany i włączony. Kliknij, aby odinstalować." ],
      "%(name)s is disabled. Click to enable.":[ "Dodatek „%(name)s” jest wyłączony. Kliknij, aby włączyć." ],
      "Uninstalling %(name)s.":[ "Odinstalowywanie dodatku „%(name)s”." ],
      "%(name)s is uninstalled. Click to install.":[ "Dodatek „%(name)s” jest odinstalowany. Kliknij, aby zainstalować." ],
      "Install state for %(name)s is unknown.":[ "Stan instalacji dodatku „%(name)s” jest nieznany." ],
      Previous:[ "Wstecz" ],
      Next:[ "Dalej" ],
      "Page %(currentPage)s of %(totalPages)s":[ "%(currentPage)s. strona z %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Zapytanie „%(query)s” zwróciło %(count)s wynik.",
        "Zapytanie „%(query)s” zwróciło %(count)s wyniki.",
        "Zapytanie „%(query)s” zwróciło %(count)s wyników." ],
      "Searching...":[ "Wyszukiwanie…" ],
      "No results were found for \"%(query)s\".":[ "Brak wyników dla zapytania „%(query)s”." ],
      "Please supply a valid search":[ "Proszę podać prawidłowe zapytanie" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Polish [pl]
//! author : Rafal Hirsz : https://github.com/evoL

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var monthsNominative = 'styczeń_luty_marzec_kwiecień_maj_czerwiec_lipiec_sierpień_wrzesień_październik_listopad_grudzień'.split('_');
var monthsSubjective = 'stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_września_października_listopada_grudnia'.split('_');
function plural(n) {
    return (n % 10 < 5) && (n % 10 > 1) && ((~~(n / 10) % 10) !== 1);
}
function translate(number, withoutSuffix, key) {
    var result = number + ' ';
    switch (key) {
        case 'm':
            return withoutSuffix ? 'minuta' : 'minutę';
        case 'mm':
            return result + (plural(number) ? 'minuty' : 'minut');
        case 'h':
            return withoutSuffix  ? 'godzina'  : 'godzinę';
        case 'hh':
            return result + (plural(number) ? 'godziny' : 'godzin');
        case 'MM':
            return result + (plural(number) ? 'miesiące' : 'miesięcy');
        case 'yy':
            return result + (plural(number) ? 'lata' : 'lat');
    }
}

var pl = moment.defineLocale('pl', {
    months : function (momentToFormat, format) {
        if (format === '') {
            // Hack: if format empty we know this is used to generate
            // RegExp by moment. Give then back both valid forms of months
            // in RegExp ready format.
            return '(' + monthsSubjective[momentToFormat.month()] + '|' + monthsNominative[momentToFormat.month()] + ')';
        } else if (/D MMMM/.test(format)) {
            return monthsSubjective[momentToFormat.month()];
        } else {
            return monthsNominative[momentToFormat.month()];
        }
    },
    monthsShort : 'sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paź_lis_gru'.split('_'),
    weekdays : 'niedziela_poniedziałek_wtorek_środa_czwartek_piątek_sobota'.split('_'),
    weekdaysShort : 'ndz_pon_wt_śr_czw_pt_sob'.split('_'),
    weekdaysMin : 'Nd_Pn_Wt_Śr_Cz_Pt_So'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[Dziś o] LT',
        nextDay: '[Jutro o] LT',
        nextWeek: '[W] dddd [o] LT',
        lastDay: '[Wczoraj o] LT',
        lastWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[W zeszłą niedzielę o] LT';
                case 3:
                    return '[W zeszłą środę o] LT';
                case 6:
                    return '[W zeszłą sobotę o] LT';
                default:
                    return '[W zeszły] dddd [o] LT';
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : 'za %s',
        past : '%s temu',
        s : 'kilka sekund',
        m : translate,
        mm : translate,
        h : translate,
        hh : translate,
        d : '1 dzień',
        dd : '%d dni',
        M : 'miesiąc',
        MM : translate,
        y : 'rok',
        yy : translate
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return pl;

})));

} }