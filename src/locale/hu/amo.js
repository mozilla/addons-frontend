module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"hu" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)s, készítette: %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Kiterjesztés metaadatai" ],
      Screenshots:[ "Képernyőképek" ],
      "About this extension":[ "A kiterjesztés névjegye" ],
      "Rate your experience":[ "Értékelje a tapasztalatait" ],
      Category:[ "Kategória" ],
      "Used by":[ "Használja" ],
      Sentiment:[ "Érzet" ],
      Back:[ "Vissza" ],
      Submit:[ "Elküldés" ],
      "Please enter some text":[ "Írjon be valamilyen szöveget" ],
      "Write a review":[ "Értékelés írása" ],
      "Tell the world why you think this extension is fantastic!":[ "Mondja el a világnak, miért gondolja, hogy ez egy fantasztikus kiegészítő!" ],
      "Privacy policy":[ "Adatvédelmi irányelvek" ],
      "Legal notices":[ "Jogi megjegyzések" ],
      "View desktop site":[ "Asztali oldal megtekintése" ],
      "Browse in your language":[ "Tallózás az Ön nyelvén" ],
      "Firefox Add-ons":[ "Firefox kiegészítők" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Mit tapasztal a(z) %(addonName)s kiegészítővel?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "képernyőkép %(imageNumber)s / %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Átlagos értékelés: %(rating)s / 5" ],
      "No ratings":[ "Nincsenek értékelések" ],
      "%(users)s user":[ "%(users)s felhasználó",
        "%(users)s felhasználó" ],
      "Log out":[ "Kijelentkezés" ],
      "Log in/Sign up":[ "Bejelentkezés/Regisztráció" ],
      "Add-ons for Firefox":[ "Kiegészítők a Firefoxhoz" ],
      "What do you want Firefox to do?":[ "Mit tegyen a Firefox?" ],
      "Block ads":[ "Blokkolja a hirdetéseket" ],
      Screenshot:[ "Készítsen képernyőképet" ],
      "Save stuff":[ "Mentsen dolgokat" ],
      "Shop online":[ "Vásároljon online" ],
      "Be social":[ "Legyen közösségi" ],
      "Share stuff":[ "Osszon meg dolgokat" ],
      "Browse all extensions":[ "Összes kiterjesztés tallózása" ],
      "How do you want Firefox to look?":[ "Milyen legyen a Firefox kinézete?" ],
      Wild:[ "Vad" ],
      Abstract:[ "Absztrakt" ],
      Fashionable:[ "Divatos" ],
      Scenic:[ "Festői" ],
      Sporty:[ "Sportos" ],
      Mystical:[ "Misztikus" ],
      "Browse all themes":[ "Összes téma tallózása" ],
      "Downloading %(name)s.":[ "%(name)s letöltése." ],
      "Installing %(name)s.":[ "%(name)s telepítése." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "A(z) %(name) telepítve van, és engedélyezett. Kattintson az eltávolításhoz." ],
      "%(name)s is disabled. Click to enable.":[ "A(z) %(name)s le van tiltva. Kattintson az engedélyezéshez." ],
      "Uninstalling %(name)s.":[ "%(name)s eltávolítása." ],
      "%(name)s is uninstalled. Click to install.":[ "A(z) %(name)s el lett távolítva. Kattintson a telepítéshez." ],
      "Install state for %(name)s is unknown.":[ "A(z) %(name)s telepítési állapota ismeretlen." ],
      Previous:[ "Előző" ],
      Next:[ "Következő" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Oldal %(currentPage)s / %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "A „%(query)s” keresés %(count)s találatot adott.",
        "A „%(query)s” keresés %(count)s találatot adott." ],
      "Searching...":[ "Keresés…" ],
      "No results were found for \"%(query)s\".":[ "Nincs találat a „%(query)s” keresésre." ],
      "Please supply a valid search":[ "Adjon meg egy érvényes keresést" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Hungarian [hu]
//! author : Adam Brunner : https://github.com/adambrunner

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var weekEndings = 'vasárnap hétfőn kedden szerdán csütörtökön pénteken szombaton'.split(' ');
function translate(number, withoutSuffix, key, isFuture) {
    var num = number,
        suffix;
    switch (key) {
        case 's':
            return (isFuture || withoutSuffix) ? 'néhány másodperc' : 'néhány másodperce';
        case 'm':
            return 'egy' + (isFuture || withoutSuffix ? ' perc' : ' perce');
        case 'mm':
            return num + (isFuture || withoutSuffix ? ' perc' : ' perce');
        case 'h':
            return 'egy' + (isFuture || withoutSuffix ? ' óra' : ' órája');
        case 'hh':
            return num + (isFuture || withoutSuffix ? ' óra' : ' órája');
        case 'd':
            return 'egy' + (isFuture || withoutSuffix ? ' nap' : ' napja');
        case 'dd':
            return num + (isFuture || withoutSuffix ? ' nap' : ' napja');
        case 'M':
            return 'egy' + (isFuture || withoutSuffix ? ' hónap' : ' hónapja');
        case 'MM':
            return num + (isFuture || withoutSuffix ? ' hónap' : ' hónapja');
        case 'y':
            return 'egy' + (isFuture || withoutSuffix ? ' év' : ' éve');
        case 'yy':
            return num + (isFuture || withoutSuffix ? ' év' : ' éve');
    }
    return '';
}
function week(isFuture) {
    return (isFuture ? '' : '[múlt] ') + '[' + weekEndings[this.day()] + '] LT[-kor]';
}

var hu = moment.defineLocale('hu', {
    months : 'január_február_március_április_május_június_július_augusztus_szeptember_október_november_december'.split('_'),
    monthsShort : 'jan_feb_márc_ápr_máj_jún_júl_aug_szept_okt_nov_dec'.split('_'),
    weekdays : 'vasárnap_hétfő_kedd_szerda_csütörtök_péntek_szombat'.split('_'),
    weekdaysShort : 'vas_hét_kedd_sze_csüt_pén_szo'.split('_'),
    weekdaysMin : 'v_h_k_sze_cs_p_szo'.split('_'),
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'YYYY.MM.DD.',
        LL : 'YYYY. MMMM D.',
        LLL : 'YYYY. MMMM D. H:mm',
        LLLL : 'YYYY. MMMM D., dddd H:mm'
    },
    meridiemParse: /de|du/i,
    isPM: function (input) {
        return input.charAt(1).toLowerCase() === 'u';
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours < 12) {
            return isLower === true ? 'de' : 'DE';
        } else {
            return isLower === true ? 'du' : 'DU';
        }
    },
    calendar : {
        sameDay : '[ma] LT[-kor]',
        nextDay : '[holnap] LT[-kor]',
        nextWeek : function () {
            return week.call(this, true);
        },
        lastDay : '[tegnap] LT[-kor]',
        lastWeek : function () {
            return week.call(this, false);
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s múlva',
        past : '%s',
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

return hu;

})));

} }