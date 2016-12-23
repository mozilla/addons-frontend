module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"nl" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)s door %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Metagegevens van extensie" ],
      Screenshots:[ "Schermafbeeldingen" ],
      "About this extension":[ "Over deze extensie" ],
      "Rate your experience":[ "Uw ervaring beoordelen" ],
      Category:[ "Categorie" ],
      "Used by":[ "Gebruikt door" ],
      Sentiment:[ "Gevoel" ],
      Back:[ "Terug" ],
      Submit:[ "Indienen" ],
      "Please enter some text":[ "Voer tekst in" ],
      "Write a review":[ "Schrijf een beoordeling" ],
      "Tell the world why you think this extension is fantastic!":[ "Beschrijf waarom u deze extensie fantastisch vindt!" ],
      "Privacy policy":[ "Privacybeleid" ],
      "Legal notices":[ "Juridische kennisgevingen" ],
      "View desktop site":[ "Desktopwebsite weergeven" ],
      "Browse in your language":[ "Bladeren in uw taal" ],
      "Firefox Add-ons":[ "Add-ons voor Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Hoe beleeft u uw ervaring met %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "schermafbeelding %(imageNumber)s van %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Gemiddelde waardering: %(rating)s van 5" ],
      "No ratings":[ "Geen waarderingen" ],
      "%(users)s user":[ "%(users)s gebruiker",
        "%(users)s gebruikers" ],
      "Log out":[ "Afmelden" ],
      "Log in/Sign up":[ "Aanmelden/Registreren" ],
      "Add-ons for Firefox":[ "Add-ons voor Firefox" ],
      "What do you want Firefox to do?":[ "Wat wilt u dat Firefox doet?" ],
      "Block ads":[ "Advertenties blokkeren" ],
      Screenshot:[ "Schermafbeelding" ],
      "Save stuff":[ "Dingen opslaan" ],
      "Shop online":[ "Online winkelen" ],
      "Be social":[ "Sociaal zijn" ],
      "Share stuff":[ "Dingen delen" ],
      "Browse all extensions":[ "Door alle extensies bladeren" ],
      "How do you want Firefox to look?":[ "Hoe wilt u Firefox eruit laten zien?" ],
      Wild:[ "Wild" ],
      Abstract:[ "Abstract" ],
      Fashionable:[ "Hip" ],
      Scenic:[ "Schilderachtig" ],
      Sporty:[ "Sportief" ],
      Mystical:[ "Mystiek" ],
      "Browse all themes":[ "Door alle thema’s bladeren" ],
      "Downloading %(name)s.":[ "%(name)s wordt gedownload." ],
      "Installing %(name)s.":[ "%(name)s wordt geïnstalleerd." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s is geïnstalleerd en ingeschakeld. Klik om te verwijderen." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s is uitgeschakeld. Klik om in te schakelen." ],
      "Uninstalling %(name)s.":[ "%(name)s wordt verwijderd." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s is verwijderd. Klik om te installeren." ],
      "Install state for %(name)s is unknown.":[ "Installatiestatus voor %(name)s is onbekend." ],
      Previous:[ "Vorige" ],
      Next:[ "Volgende" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Pagina %(currentPage)s van %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Uw zoekopdracht naar ‘%(query)s’ heeft %(count)s resultaat opgeleverd.",
        "Uw zoekopdracht naar ‘%(query)s’ heeft %(count)s resultaten opgeleverd." ],
      "Searching...":[ "Zoeken..." ],
      "No results were found for \"%(query)s\".":[ "Geen resultaten voor ‘%(query)s’ gevonden." ],
      "Please supply a valid search":[ "Geef een geldige zoekopdracht op" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Dutch [nl]
//! author : Joris Röling : https://github.com/jorisroling
//! author : Jacob Middag : https://github.com/middagj

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var monthsShortWithDots = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split('_');
var monthsShortWithoutDots = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split('_');

var monthsParse = [/^jan/i, /^feb/i, /^maart|mrt.?$/i, /^apr/i, /^mei$/i, /^jun[i.]?$/i, /^jul[i.]?$/i, /^aug/i, /^sep/i, /^okt/i, /^nov/i, /^dec/i];
var monthsRegex = /^(januari|februari|maart|april|mei|april|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;

var nl = moment.defineLocale('nl', {
    months : 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split('_'),
    monthsShort : function (m, format) {
        if (/-MMM-/.test(format)) {
            return monthsShortWithoutDots[m.month()];
        } else {
            return monthsShortWithDots[m.month()];
        }
    },

    monthsRegex: monthsRegex,
    monthsShortRegex: monthsRegex,
    monthsStrictRegex: /^(januari|februari|maart|mei|ju[nl]i|april|augustus|september|oktober|november|december)/i,
    monthsShortStrictRegex: /^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,

    monthsParse : monthsParse,
    longMonthsParse : monthsParse,
    shortMonthsParse : monthsParse,

    weekdays : 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split('_'),
    weekdaysShort : 'zo._ma._di._wo._do._vr._za.'.split('_'),
    weekdaysMin : 'Zo_Ma_Di_Wo_Do_Vr_Za'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD-MM-YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[vandaag om] LT',
        nextDay: '[morgen om] LT',
        nextWeek: 'dddd [om] LT',
        lastDay: '[gisteren om] LT',
        lastWeek: '[afgelopen] dddd [om] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'over %s',
        past : '%s geleden',
        s : 'een paar seconden',
        m : 'één minuut',
        mm : '%d minuten',
        h : 'één uur',
        hh : '%d uur',
        d : 'één dag',
        dd : '%d dagen',
        M : 'één maand',
        MM : '%d maanden',
        y : 'één jaar',
        yy : '%d jaar'
    },
    ordinalParse: /\d{1,2}(ste|de)/,
    ordinal : function (number) {
        return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return nl;

})));

} }