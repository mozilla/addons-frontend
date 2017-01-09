module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"bg" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)sот %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Метаданни за разширението" ],
      Screenshots:[ "Снимки на екрана" ],
      "About this extension":[ "Относно добавката" ],
      "Rate your experience":[ "Дайте оценка" ],
      Category:[ "Категория" ],
      "Used by":[ "Ползвател" ],
      Sentiment:[ "Мнение" ],
      Back:[ "Назад" ],
      Submit:[ "Изпращане" ],
      "Please enter some text":[ "Моля, въведете текст" ],
      "Write a review":[ "Писане на отзив" ],
      "Tell the world why you think this extension is fantastic!":[ "Разкажете на света защо смятате, че това разширение е чудесно!" ],
      "Privacy policy":[ "Политика на поверителност" ],
      "Legal notices":[ "Правни бележки" ],
      "View desktop site":[ "Настолна версия" ],
      "Browse in your language":[ "Четете на своя език" ],
      "Firefox Add-ons":[ "Добавки за Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "До каква степен ви харесва %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "снимка %(imageNumber)s от %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Средна оценка: %(rating)s от 5" ],
      "No ratings":[ "Без оценка" ],
      "%(users)s user":[ "%(users)s потребител",
        "%(users)s потребителя" ],
      "Log out":[ "Изход" ],
      "Log in/Sign up":[ "Вход/Регистрация" ],
      "Add-ons for Firefox":[ "Добавки за Firefox" ],
      "What do you want Firefox to do?":[ "Какво бихте желали Firefox да направи?" ],
      "Block ads":[ "Блокиране на реклами" ],
      Screenshot:[ "Снимка на екрана" ],
      "Save stuff":[ "Запазване на неща" ],
      "Shop online":[ "Пазаруване он-лайн" ],
      "Be social":[ "Бъде социален" ],
      "Share stuff":[ "Споделя неща" ],
      "Browse all extensions":[ "Преглед на всички разширения" ],
      "How do you want Firefox to look?":[ "Как бихте желали Firefox да изглежда?" ],
      Wild:[ "Див" ],
      Abstract:[ "Абстрактен" ],
      Fashionable:[ "Модерен" ],
      Scenic:[ "Жовиписен" ],
      Sporty:[ "Спортен" ],
      Mystical:[ "Мистичен" ],
      "Browse all themes":[ "Преглед на всички теми" ],
      "Downloading %(name)s.":[ "Изтегляне на %(name)s." ],
      "Installing %(name)s.":[ "Инсталиране на %(name)s." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s е инсталирана и включена. Натиснете за премахване." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s е изключена. Натиснете за включване." ],
      "Uninstalling %(name)s.":[ "Премахване на %(name)s." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s е премахната. Натиснете за инсталиране." ],
      "Install state for %(name)s is unknown.":[ "Състоянието на инсталацията на %(name)s е неизвестно." ],
      Previous:[ "Предишна" ],
      Next:[ "Следваща" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Страница %(currentPage)s от %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Търсенето ви за „%(query)s“ върна %(count)s резултат.",
        "Търсенето ви за „%(query)s“ върна %(count)s резултата." ],
      "Searching...":[ "Търсене…" ],
      "No results were found for \"%(query)s\".":[ "Не бяха намерени резултати за „%(query)s“." ],
      "Please supply a valid search":[ "Въведете термин" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Bulgarian [bg]
//! author : Krasen Borisov : https://github.com/kraz

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var bg = moment.defineLocale('bg', {
    months : 'януари_февруари_март_април_май_юни_юли_август_септември_октомври_ноември_декември'.split('_'),
    monthsShort : 'янр_фев_мар_апр_май_юни_юли_авг_сеп_окт_ное_дек'.split('_'),
    weekdays : 'неделя_понеделник_вторник_сряда_четвъртък_петък_събота'.split('_'),
    weekdaysShort : 'нед_пон_вто_сря_чет_пет_съб'.split('_'),
    weekdaysMin : 'нд_пн_вт_ср_чт_пт_сб'.split('_'),
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'D.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY H:mm',
        LLLL : 'dddd, D MMMM YYYY H:mm'
    },
    calendar : {
        sameDay : '[Днес в] LT',
        nextDay : '[Утре в] LT',
        nextWeek : 'dddd [в] LT',
        lastDay : '[Вчера в] LT',
        lastWeek : function () {
            switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[В изминалата] dddd [в] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[В изминалия] dddd [в] LT';
            }
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : 'след %s',
        past : 'преди %s',
        s : 'няколко секунди',
        m : 'минута',
        mm : '%d минути',
        h : 'час',
        hh : '%d часа',
        d : 'ден',
        dd : '%d дни',
        M : 'месец',
        MM : '%d месеца',
        y : 'година',
        yy : '%d години'
    },
    ordinalParse: /\d{1,2}-(ев|ен|ти|ви|ри|ми)/,
    ordinal : function (number) {
        var lastDigit = number % 10,
            last2Digits = number % 100;
        if (number === 0) {
            return number + '-ев';
        } else if (last2Digits === 0) {
            return number + '-ен';
        } else if (last2Digits > 10 && last2Digits < 20) {
            return number + '-ти';
        } else if (lastDigit === 1) {
            return number + '-ви';
        } else if (lastDigit === 2) {
            return number + '-ри';
        } else if (lastDigit === 7 || lastDigit === 8) {
            return number + '-ми';
        } else {
            return number + '-ти';
        }
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

return bg;

})));

} }