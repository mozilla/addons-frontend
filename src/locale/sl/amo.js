module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=4; plural=(n%100==1 ? 0 : n%100==2 ? 1 : n%100==3 || n%100==4 ? 2 : 3);",
        lang:"sl" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)s– %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Metapodatki o razširitvi" ],
      Screenshots:[ "Posnetki zaslona" ],
      "About this extension":[ "O tej razširitvi" ],
      "Rate your experience":[ "Ocenite svojo izkušnjo" ],
      Category:[ "Kategorija" ],
      "Used by":[ "Uporablja" ],
      Sentiment:[ "Občutek" ],
      Back:[ "Nazaj" ],
      Submit:[ "Predloži" ],
      "Please enter some text":[ "Vnesite nekaj besedila" ],
      "Write a review":[ "Napišite oceno" ],
      "Tell the world why you think this extension is fantastic!":[ "Pojasnite svetu, zakaj se vam ta razširitev zdi odlična!" ],
      "Privacy policy":[ "Pravilnik o zasebnosti" ],
      "Legal notices":[ "Pravna obvestila" ],
      "View desktop site":[ "Ogled strani za namizja" ],
      "Browse in your language":[ "Brskajte v svojem jeziku" ],
      "Firefox Add-ons":[ "Dodatki za Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Kako vam ugaja %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "posnetek zaslona %(imageNumber)s od %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Povprečna ocena: %(rating)s od 5" ],
      "No ratings":[ "Ni ocen" ],
      "%(users)s user":[ "%(users)s uporabnik",
        "%(users)s uporabnika",
        "%(users)s uporabniki",
        "%(users)s uporabnikov" ],
      "Log out":[ "Odjava" ],
      "Log in/Sign up":[ "Prijava/Registracija" ],
      "Add-ons for Firefox":[ "Dodatki za Firefox" ],
      "What do you want Firefox to do?":[ "Kaj naj Firefox počne?" ],
      "Block ads":[ "Zavrača oglase" ],
      Screenshot:[ "Ustvarja posnetke zaslona" ],
      "Save stuff":[ "Shranjuje vsebino" ],
      "Shop online":[ "Nakupuje na spletu" ],
      "Be social":[ "Postane družaben" ],
      "Share stuff":[ "Deli vsebino" ],
      "Browse all extensions":[ "Prebrskaj vse razširitve" ],
      "How do you want Firefox to look?":[ "Kako naj bo Firefox videti?" ],
      Wild:[ "Divje" ],
      Abstract:[ "Abstraktno" ],
      Fashionable:[ "Modno" ],
      Scenic:[ "Slikovito" ],
      Sporty:[ "Športno" ],
      Mystical:[ "Mistično" ],
      "Browse all themes":[ "Prebrskaj vse teme" ],
      "Downloading %(name)s.":[ "Prenašanje %(name)s." ],
      "Installing %(name)s.":[ "Nameščanje %(name)s." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s je nameščen in omogočen. Kliknite za odstranitev." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s je onemogočen. Kliknite, da ga omogočite." ],
      "Uninstalling %(name)s.":[ "Odstranjevanje %(name)s." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s je bil odstranjen. Kliknite za namestitev." ],
      "Install state for %(name)s is unknown.":[ "Ni znano, ali je %(name)s nameščen ali ne." ],
      Previous:[ "Prejšnja" ],
      Next:[ "Naslednja" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Stran %(currentPage)s od %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Najden je %(count)s rezultat za \"%(query)s\".",
        "Najdena sta %(count)s rezultata za \"%(query)s\".",
        "Najdeni so %(count)s rezultati za \"%(query)s\".",
        "Najdenih je %(count)s rezultatov za \"%(query)s\"." ],
      "Searching...":[ "Iskanje ..." ],
      "No results were found for \"%(query)s\".":[ "Ni najdenih rezultatov za \"%(query)s\"." ],
      "Please supply a valid search":[ "Vnesite veljavno iskalno poizvedbo" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Slovenian [sl]
//! author : Robert Sedovšek : https://github.com/sedovsek

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


function processRelativeTime(number, withoutSuffix, key, isFuture) {
    var result = number + ' ';
    switch (key) {
        case 's':
            return withoutSuffix || isFuture ? 'nekaj sekund' : 'nekaj sekundami';
        case 'm':
            return withoutSuffix ? 'ena minuta' : 'eno minuto';
        case 'mm':
            if (number === 1) {
                result += withoutSuffix ? 'minuta' : 'minuto';
            } else if (number === 2) {
                result += withoutSuffix || isFuture ? 'minuti' : 'minutama';
            } else if (number < 5) {
                result += withoutSuffix || isFuture ? 'minute' : 'minutami';
            } else {
                result += withoutSuffix || isFuture ? 'minut' : 'minutami';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'ena ura' : 'eno uro';
        case 'hh':
            if (number === 1) {
                result += withoutSuffix ? 'ura' : 'uro';
            } else if (number === 2) {
                result += withoutSuffix || isFuture ? 'uri' : 'urama';
            } else if (number < 5) {
                result += withoutSuffix || isFuture ? 'ure' : 'urami';
            } else {
                result += withoutSuffix || isFuture ? 'ur' : 'urami';
            }
            return result;
        case 'd':
            return withoutSuffix || isFuture ? 'en dan' : 'enim dnem';
        case 'dd':
            if (number === 1) {
                result += withoutSuffix || isFuture ? 'dan' : 'dnem';
            } else if (number === 2) {
                result += withoutSuffix || isFuture ? 'dni' : 'dnevoma';
            } else {
                result += withoutSuffix || isFuture ? 'dni' : 'dnevi';
            }
            return result;
        case 'M':
            return withoutSuffix || isFuture ? 'en mesec' : 'enim mesecem';
        case 'MM':
            if (number === 1) {
                result += withoutSuffix || isFuture ? 'mesec' : 'mesecem';
            } else if (number === 2) {
                result += withoutSuffix || isFuture ? 'meseca' : 'mesecema';
            } else if (number < 5) {
                result += withoutSuffix || isFuture ? 'mesece' : 'meseci';
            } else {
                result += withoutSuffix || isFuture ? 'mesecev' : 'meseci';
            }
            return result;
        case 'y':
            return withoutSuffix || isFuture ? 'eno leto' : 'enim letom';
        case 'yy':
            if (number === 1) {
                result += withoutSuffix || isFuture ? 'leto' : 'letom';
            } else if (number === 2) {
                result += withoutSuffix || isFuture ? 'leti' : 'letoma';
            } else if (number < 5) {
                result += withoutSuffix || isFuture ? 'leta' : 'leti';
            } else {
                result += withoutSuffix || isFuture ? 'let' : 'leti';
            }
            return result;
    }
}

var sl = moment.defineLocale('sl', {
    months : 'januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december'.split('_'),
    monthsShort : 'jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.'.split('_'),
    monthsParseExact: true,
    weekdays : 'nedelja_ponedeljek_torek_sreda_četrtek_petek_sobota'.split('_'),
    weekdaysShort : 'ned._pon._tor._sre._čet._pet._sob.'.split('_'),
    weekdaysMin : 'ne_po_to_sr_če_pe_so'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY H:mm',
        LLLL : 'dddd, D. MMMM YYYY H:mm'
    },
    calendar : {
        sameDay  : '[danes ob] LT',
        nextDay  : '[jutri ob] LT',

        nextWeek : function () {
            switch (this.day()) {
                case 0:
                    return '[v] [nedeljo] [ob] LT';
                case 3:
                    return '[v] [sredo] [ob] LT';
                case 6:
                    return '[v] [soboto] [ob] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[v] dddd [ob] LT';
            }
        },
        lastDay  : '[včeraj ob] LT',
        lastWeek : function () {
            switch (this.day()) {
                case 0:
                    return '[prejšnjo] [nedeljo] [ob] LT';
                case 3:
                    return '[prejšnjo] [sredo] [ob] LT';
                case 6:
                    return '[prejšnjo] [soboto] [ob] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[prejšnji] dddd [ob] LT';
            }
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : 'čez %s',
        past   : 'pred %s',
        s      : processRelativeTime,
        m      : processRelativeTime,
        mm     : processRelativeTime,
        h      : processRelativeTime,
        hh     : processRelativeTime,
        d      : processRelativeTime,
        dd     : processRelativeTime,
        M      : processRelativeTime,
        MM     : processRelativeTime,
        y      : processRelativeTime,
        yy     : processRelativeTime
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

return sl;

})));

} }