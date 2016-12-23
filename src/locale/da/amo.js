module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"da" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)s af %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Metadata for udvidelsen" ],
      Screenshots:[ "Skærmbilleder" ],
      "About this extension":[ "Om denne udvidelse" ],
      "Rate your experience":[ "Bedøm din oplevelse" ],
      Category:[ "Kategori" ],
      "Used by":[ "Brugt af" ],
      Sentiment:[ "Indtryk" ],
      Back:[ "Tilbage" ],
      Submit:[ "Indsend" ],
      "Please enter some text":[ "Indtast noget tekst" ],
      "Write a review":[ "Skriv en anmeldelse" ],
      "Tell the world why you think this extension is fantastic!":[ "Fortæl verden, hvorfor du synes denne udvidelse er fantastisk!" ],
      "Privacy policy":[ "Privatlivspolitik" ],
      "Legal notices":[ "Juridiske betingelser" ],
      "View desktop site":[ "Vis desktop-site" ],
      "Browse in your language":[ "Surf på dit sprog" ],
      "Firefox Add-ons":[ "Tilføjelser til Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Hvordan er din oplevelse med %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "skærmbillede %(imageNumber)s af %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Gennemsnitlig bedømmelse: %(rating)s ud af 5" ],
      "No ratings":[ "Ingen bedømmelser" ],
      "%(users)s user":[ "%(users)s bruger",
        "%(users)s brugere" ],
      "Log out":[ "Log ud" ],
      "Log in/Sign up":[ "Log ind/registrer dig" ],
      "Add-ons for Firefox":[ "Tilføjelser til Firefox" ],
      "What do you want Firefox to do?":[ "Hvad skal Firefox gøre?" ],
      "Block ads":[ "Blokere reklamer" ],
      Screenshot:[ "Skærmbillede" ],
      "Save stuff":[ "Gemme ting" ],
      "Shop online":[ "Shoppe online" ],
      "Be social":[ "Være social" ],
      "Share stuff":[ "Dele ting" ],
      "Browse all extensions":[ "Gennemse alle udvidelser" ],
      "How do you want Firefox to look?":[ "Hvordan skal Firefox se ud?" ],
      Wild:[ "Vild" ],
      Abstract:[ "Abstrakt" ],
      Fashionable:[ "Moderne" ],
      Scenic:[ "Malerisk" ],
      Sporty:[ "Sporty" ],
      Mystical:[ "Mystisk" ],
      "Browse all themes":[ "Gennemse alle temaer" ],
      "Downloading %(name)s.":[ "Henter %(name)s." ],
      "Installing %(name)s.":[ "Installerer %(name)s." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s er installeret og aktiveret. Klik for at afinstallere." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s er deaktiveret. Klik for at aktivere." ],
      "Uninstalling %(name)s.":[ "Afinstallerer %(name)s." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s er afinstalleret. Klik for at installere." ],
      "Install state for %(name)s is unknown.":[ "Installationstilstand for %(name)s er ukendt." ],
      Previous:[ "Forrige" ],
      Next:[ "Næste" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Side %(currentPage)s af %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Din søgning efter \"%(query)s\" returnerede %(count)s resultat.",
        "Din søgning efter \"%(query)s\" returnerede %(count)s resultater." ],
      "Searching...":[ "Søger..." ],
      "No results were found for \"%(query)s\".":[ "Der blev ikke fundet nogen forekomster af \"%(query)s\"." ],
      "Please supply a valid search":[ "Angiv en gyldig søgning" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Danish [da]
//! author : Ulrik Nielsen : https://github.com/mrbase

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var da = moment.defineLocale('da', {
    months : 'januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december'.split('_'),
    monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
    weekdays : 'søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag'.split('_'),
    weekdaysShort : 'søn_man_tir_ons_tor_fre_lør'.split('_'),
    weekdaysMin : 'sø_ma_ti_on_to_fr_lø'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY HH:mm',
        LLLL : 'dddd [d.] D. MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[I dag kl.] LT',
        nextDay : '[I morgen kl.] LT',
        nextWeek : 'dddd [kl.] LT',
        lastDay : '[I går kl.] LT',
        lastWeek : '[sidste] dddd [kl] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'om %s',
        past : '%s siden',
        s : 'få sekunder',
        m : 'et minut',
        mm : '%d minutter',
        h : 'en time',
        hh : '%d timer',
        d : 'en dag',
        dd : '%d dage',
        M : 'en måned',
        MM : '%d måneder',
        y : 'et år',
        yy : '%d år'
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return da;

})));

} }