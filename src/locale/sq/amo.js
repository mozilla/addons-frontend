module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"sq" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)snga %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Tejtëdhëna Zgjerimi" ],
      Screenshots:[ "Foto ekrani" ],
      "About this extension":[ "Rreth këtij zgjerimi:" ],
      "Rate your experience":[ "Vlerësoni rastin tuaj" ],
      Category:[ "Kategori" ],
      "Used by":[ "Përdorur nga" ],
      Sentiment:[ "Ndjenjë" ],
      Back:[ "Mbrapsht" ],
      Submit:[ "Parashtroje" ],
      "Please enter some text":[ "Ju lutemi, jepni ca tekst" ],
      "Write a review":[ "Shkruani një shqyrtim" ],
      "Tell the world why you think this extension is fantastic!":[ "Tregojini botës pse mendoni se ky zgjerim është fantastik!" ],
      "Privacy policy":[ "Rregulla privatësie" ],
      "Legal notices":[ "Shënime ligjore" ],
      "View desktop site":[ "Shihni sajtin për desktop" ],
      "Browse in your language":[ "Shfletoni në gjuhën tuaj" ],
      "Firefox Add-ons":[ "Shtesa Firefox-i" ],
      "How are you enjoying your experience with %(addonName)s?":[ "A po ju pëlqen %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "fotoja e %(imageNumber)s-të e ekrani nga %(totalImages)s gjithsej" ],
      "Average rating: %(rating)s out of 5":[ "Vlerësimi mesatar: %(rating)s nga 5" ],
      "No ratings":[ "Pa vlerësime" ],
      "%(users)s user":[ "%(users)s përdorues",
        "%(users)s përdorues" ],
      "Log out":[ "Dilni" ],
      "Log in/Sign up":[ "Hyni/Regjistrohuni" ],
      "Add-ons for Firefox":[ "Shtesa për Firefox-in" ],
      "What do you want Firefox to do?":[ "Çfarë doni të bëjë Firefox-i?" ],
      "Block ads":[ "Bllokoni reklama" ],
      Screenshot:[ "Foto ekrani" ],
      "Save stuff":[ "Ruani gjëra" ],
      "Shop online":[ "Blini në Internet" ],
      "Be social":[ "Jini shoqëror" ],
      "Share stuff":[ "Ndani gjëra me të tjerët" ],
      "Browse all extensions":[ "Shfletojini krejt zgjerimet" ],
      "How do you want Firefox to look?":[ "Si dëshironi të duket Firefox-i?" ],
      Wild:[ "Wild" ],
      Abstract:[ "Abstrakte" ],
      Fashionable:[ "E modës" ],
      Scenic:[ "Skenike" ],
      Sporty:[ "Sportive" ],
      Mystical:[ "Mistik" ],
      "Browse all themes":[ "Shfletoni krejt temat" ],
      "Downloading %(name)s.":[ "Shkarkim i %(name)s." ],
      "Installing %(name)s.":[ "Instalim i %(name)s." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s është e instaluar dhe e aktivizuar. Klikoni që të çinstalohet." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s është çaktivizuar. Klikoni që të aktivizohet." ],
      "Uninstalling %(name)s.":[ "Çinstalim i %(name)s." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s është e çinstaluar. Klikoni që të instalohet." ],
      "Install state for %(name)s is unknown.":[ "Gjendja e instalimit për %(name)s është e panjohur." ],
      Previous:[ "I mëparshmi" ],
      Next:[ "Pasuesi" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Faqja %(currentPage)s nga %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Kërkimi juaj për \"%(query)s\" dha %(count)s përfundim.",
        "Kërkimi juaj për \"%(query)s\" dha %(count)s përfundime." ],
      "Searching...":[ "Po kërkohet…" ],
      "No results were found for \"%(query)s\".":[ "S’u gjetën përfundime për \"%(query)s\"." ],
      "Please supply a valid search":[ "Ju lutemi, jepni një kërkim të vlefshëm" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Albanian [sq]
//! author : Flakërim Ismani : https://github.com/flakerimi
//! author : Menelion Elensúle : https://github.com/Oire
//! author : Oerd Cukalla : https://github.com/oerd

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var sq = moment.defineLocale('sq', {
    months : 'Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_Nëntor_Dhjetor'.split('_'),
    monthsShort : 'Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_Nën_Dhj'.split('_'),
    weekdays : 'E Diel_E Hënë_E Martë_E Mërkurë_E Enjte_E Premte_E Shtunë'.split('_'),
    weekdaysShort : 'Die_Hën_Mar_Mër_Enj_Pre_Sht'.split('_'),
    weekdaysMin : 'D_H_Ma_Më_E_P_Sh'.split('_'),
    weekdaysParseExact : true,
    meridiemParse: /PD|MD/,
    isPM: function (input) {
        return input.charAt(0) === 'M';
    },
    meridiem : function (hours, minutes, isLower) {
        return hours < 12 ? 'PD' : 'MD';
    },
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[Sot në] LT',
        nextDay : '[Nesër në] LT',
        nextWeek : 'dddd [në] LT',
        lastDay : '[Dje në] LT',
        lastWeek : 'dddd [e kaluar në] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'në %s',
        past : '%s më parë',
        s : 'disa sekonda',
        m : 'një minutë',
        mm : '%d minuta',
        h : 'një orë',
        hh : '%d orë',
        d : 'një ditë',
        dd : '%d ditë',
        M : 'një muaj',
        MM : '%d muaj',
        y : 'një vit',
        yy : '%d vite'
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return sq;

})));

} }