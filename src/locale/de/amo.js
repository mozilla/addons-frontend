module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"de" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)s von %(authorList)s %(endSpan)s" ],
      "Extension Metadata":[ "Metadaten zur Erweiterung" ],
      Screenshots:[ "Screenshots" ],
      "About this extension":[ "Über diese Erweiterung" ],
      "Rate your experience":[ "Bewertung Ihres Eindrucks" ],
      Category:[ "Kategorie" ],
      "Used by":[ "Verwendet von" ],
      Sentiment:[ "Eindruck" ],
      Back:[ "Zurück" ],
      Submit:[ "Absenden" ],
      "Please enter some text":[ "Bitte geben Sie Text ein" ],
      "Write a review":[ "Schreiben Sie eine Bewertung" ],
      "Tell the world why you think this extension is fantastic!":[ "Beschreiben Sie, warum Ihnen diese Erweiterung gefällt." ],
      "Privacy policy":[ "Datenschutzrichtlinie" ],
      "Legal notices":[ "Rechtliche Hinweise" ],
      "View desktop site":[ "Desktop-Website anzeigen" ],
      "Browse in your language":[ "In Ihrer Sprache ansehen" ],
      "Firefox Add-ons":[ "Add-ons für Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Wie gefällt Ihnen %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "Screenshot %(imageNumber)s von %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Durchschnittliche Bewertung: %(rating)s von 5" ],
      "No ratings":[ "Keine Bewertungen" ],
      "%(users)s user":[ "%(users)s Benutzer",
        "%(users)s Benutzer" ],
      "Log out":[ "Abmelden" ],
      "Log in/Sign up":[ "Anmelden / Registrieren" ],
      "Add-ons for Firefox":[ "Add-ons für Firefox" ],
      "What do you want Firefox to do?":[ "Was soll Firefox tun?" ],
      "Block ads":[ "Werbung blockieren" ],
      Screenshot:[ "Screenshot" ],
      "Save stuff":[ "Inhalte speichern" ],
      "Shop online":[ "Online einkaufen" ],
      "Be social":[ "Sozial sein" ],
      "Share stuff":[ "Inhalte teilen" ],
      "Browse all extensions":[ "Alle Erweiterungen durchsehen" ],
      "How do you want Firefox to look?":[ "Wie soll Firefox aussehen?" ],
      Wild:[ "Wild" ],
      Abstract:[ "Abstrakt" ],
      Fashionable:[ "Modisch" ],
      Scenic:[ "Malerisch" ],
      Sporty:[ "Sportlich" ],
      Mystical:[ "Geheimnisvoll" ],
      "Browse all themes":[ "Alle Themes durchsehen" ],
      "Downloading %(name)s.":[ "%(name)s wird heruntergeladen." ],
      "Installing %(name)s.":[ "%(name)s wird installiert." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s wurde installiert und aktiviert. Klicken Sie, um es zu deinstallieren." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s wurde deaktiviert. Klicken Sie, um es zu aktivieren." ],
      "Uninstalling %(name)s.":[ "%(name)s wird deinstalliert." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s wurde deinstalliert. Klicken Sie, um es zu installieren." ],
      "Install state for %(name)s is unknown.":[ "Installationsstatus für %(name)s ist unbekannt." ],
      Previous:[ "Vorherige" ],
      Next:[ "Nächste" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Seite %(currentPage)s von %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Ihre Suche nach „%(query)s“ ergab %(count)s Ergebnis.",
        "Ihre Suche nach „%(query)s“ ergab %(count)s Ergebnisse." ],
      "Searching...":[ "Suche läuft…" ],
      "No results were found for \"%(query)s\".":[ "Ihre Suche nach „%(query)s“ ergab keine Ergebnisse." ],
      "Please supply a valid search":[ "Bitte geben Sie einen gültigen Suchbegriff ein." ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : German [de]
//! author : lluchs : https://github.com/lluchs
//! author: Menelion Elensúle: https://github.com/Oire
//! author : Mikolaj Dadela : https://github.com/mik01aj

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


function processRelativeTime(number, withoutSuffix, key, isFuture) {
    var format = {
        'm': ['eine Minute', 'einer Minute'],
        'h': ['eine Stunde', 'einer Stunde'],
        'd': ['ein Tag', 'einem Tag'],
        'dd': [number + ' Tage', number + ' Tagen'],
        'M': ['ein Monat', 'einem Monat'],
        'MM': [number + ' Monate', number + ' Monaten'],
        'y': ['ein Jahr', 'einem Jahr'],
        'yy': [number + ' Jahre', number + ' Jahren']
    };
    return withoutSuffix ? format[key][0] : format[key][1];
}

var de = moment.defineLocale('de', {
    months : 'Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
    monthsShort : 'Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
    monthsParseExact : true,
    weekdays : 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
    weekdaysShort : 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
    weekdaysMin : 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT: 'HH:mm',
        LTS: 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY HH:mm',
        LLLL : 'dddd, D. MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[heute um] LT [Uhr]',
        sameElse: 'L',
        nextDay: '[morgen um] LT [Uhr]',
        nextWeek: 'dddd [um] LT [Uhr]',
        lastDay: '[gestern um] LT [Uhr]',
        lastWeek: '[letzten] dddd [um] LT [Uhr]'
    },
    relativeTime : {
        future : 'in %s',
        past : 'vor %s',
        s : 'ein paar Sekunden',
        m : processRelativeTime,
        mm : '%d Minuten',
        h : processRelativeTime,
        hh : '%d Stunden',
        d : processRelativeTime,
        dd : processRelativeTime,
        M : processRelativeTime,
        MM : processRelativeTime,
        y : processRelativeTime,
        yy : processRelativeTime
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return de;

})));

} }