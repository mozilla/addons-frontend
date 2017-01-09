module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);",
        lang:"uk" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)s від %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Метадані розширення" ],
      Screenshots:[ "Знімки екрану" ],
      "About this extension":[ "Про це розширення" ],
      "Rate your experience":[ "Оцініть" ],
      Category:[ "Категорія" ],
      "Used by":[ "Використовується" ],
      Sentiment:[ "Враження" ],
      Back:[ "Назад" ],
      Submit:[ "Відправити" ],
      "Please enter some text":[ "Введіть якийсь текст" ],
      "Write a review":[ "Напишіть відгук" ],
      "Tell the world why you think this extension is fantastic!":[ "Розкажіть світу, чому ви вважаєте це розширення фантастичним!" ],
      "Privacy policy":[ "Політика приватності" ],
      "Legal notices":[ "Юридичні відомості" ],
      "View desktop site":[ "Повна версія сайту" ],
      "Browse in your language":[ "Перегляд вашою мовою" ],
      "Firefox Add-ons":[ "Додатки Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Які ваші враження від роботи з %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "знімок екрану %(imageNumber)s із %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Середня оцінка: %(rating)s із 5" ],
      "No ratings":[ "Немає оцінок" ],
      "%(users)s user":[ "%(users)s користувач",
        "%(users)s користувача",
        "%(users)s користувачів" ],
      "Log out":[ "Вийти" ],
      "Log in/Sign up":[ "Вхід/Реєстрація" ],
      "Add-ons for Firefox":[ "Додатки для Firefox" ],
      "What do you want Firefox to do?":[ "Що ви хочете робити з Firefox?" ],
      "Block ads":[ "Блокувати рекламу" ],
      Screenshot:[ "Знімок екрану" ],
      "Save stuff":[ "Зберігати" ],
      "Shop online":[ "Покупки онлайн" ],
      "Be social":[ "Спілкуватися" ],
      "Share stuff":[ "Ділитися" ],
      "Browse all extensions":[ "Перегляд всіх розширень" ],
      "How do you want Firefox to look?":[ "Який ви хочете вигляд Firefox?" ],
      Wild:[ "Природний" ],
      Abstract:[ "Абстрактний" ],
      Fashionable:[ "Модний" ],
      Scenic:[ "Сценічний" ],
      Sporty:[ "Спортивний" ],
      Mystical:[ "Містичний" ],
      "Browse all themes":[ "Перегляд всіх тем" ],
      "Downloading %(name)s.":[ "Завантаження %(name)s." ],
      "Installing %(name)s.":[ "Встановлення %(name)s." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s встановлено й активовано. Натисніть для видалення." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s вимкнено. Натисніть для увімкнення." ],
      "Uninstalling %(name)s.":[ "Видалення %(name)s." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s видалено. Натисніть для встановлення." ],
      "Install state for %(name)s is unknown.":[ "Стан встановлення для %(name)s невідомий." ],
      Previous:[ "Назад" ],
      Next:[ "Далі" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Сторінка %(currentPage)s із %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "За вашим запитом \"%(query)s\" знайдено %(count)s результат.",
        "За вашим запитом \"%(query)s\" знайдено %(count)s результати.",
        "За вашим запитом \"%(query)s\" знайдено %(count)s результатів." ],
      "Searching...":[ "Пошук..." ],
      "No results were found for \"%(query)s\".":[ "Не знайдено результатів для запиту \"%(query)s\"." ],
      "Please supply a valid search":[ "Введіть точніший запит" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Ukrainian [uk]
//! author : zemlanin : https://github.com/zemlanin
//! Author : Menelion Elensúle : https://github.com/Oire

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


function plural(word, num) {
    var forms = word.split('_');
    return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
}
function relativeTimeWithPlural(number, withoutSuffix, key) {
    var format = {
        'mm': withoutSuffix ? 'хвилина_хвилини_хвилин' : 'хвилину_хвилини_хвилин',
        'hh': withoutSuffix ? 'година_години_годин' : 'годину_години_годин',
        'dd': 'день_дні_днів',
        'MM': 'місяць_місяці_місяців',
        'yy': 'рік_роки_років'
    };
    if (key === 'm') {
        return withoutSuffix ? 'хвилина' : 'хвилину';
    }
    else if (key === 'h') {
        return withoutSuffix ? 'година' : 'годину';
    }
    else {
        return number + ' ' + plural(format[key], +number);
    }
}
function weekdaysCaseReplace(m, format) {
    var weekdays = {
        'nominative': 'неділя_понеділок_вівторок_середа_четвер_п’ятниця_субота'.split('_'),
        'accusative': 'неділю_понеділок_вівторок_середу_четвер_п’ятницю_суботу'.split('_'),
        'genitive': 'неділі_понеділка_вівторка_середи_четверга_п’ятниці_суботи'.split('_')
    },
    nounCase = (/(\[[ВвУу]\]) ?dddd/).test(format) ?
        'accusative' :
        ((/\[?(?:минулої|наступної)? ?\] ?dddd/).test(format) ?
            'genitive' :
            'nominative');
    return weekdays[nounCase][m.day()];
}
function processHoursFunction(str) {
    return function () {
        return str + 'о' + (this.hours() === 11 ? 'б' : '') + '] LT';
    };
}

var uk = moment.defineLocale('uk', {
    months : {
        'format': 'січня_лютого_березня_квітня_травня_червня_липня_серпня_вересня_жовтня_листопада_грудня'.split('_'),
        'standalone': 'січень_лютий_березень_квітень_травень_червень_липень_серпень_вересень_жовтень_листопад_грудень'.split('_')
    },
    monthsShort : 'січ_лют_бер_квіт_трав_черв_лип_серп_вер_жовт_лист_груд'.split('_'),
    weekdays : weekdaysCaseReplace,
    weekdaysShort : 'нд_пн_вт_ср_чт_пт_сб'.split('_'),
    weekdaysMin : 'нд_пн_вт_ср_чт_пт_сб'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY р.',
        LLL : 'D MMMM YYYY р., HH:mm',
        LLLL : 'dddd, D MMMM YYYY р., HH:mm'
    },
    calendar : {
        sameDay: processHoursFunction('[Сьогодні '),
        nextDay: processHoursFunction('[Завтра '),
        lastDay: processHoursFunction('[Вчора '),
        nextWeek: processHoursFunction('[У] dddd ['),
        lastWeek: function () {
            switch (this.day()) {
                case 0:
                case 3:
                case 5:
                case 6:
                    return processHoursFunction('[Минулої] dddd [').call(this);
                case 1:
                case 2:
                case 4:
                    return processHoursFunction('[Минулого] dddd [').call(this);
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : 'за %s',
        past : '%s тому',
        s : 'декілька секунд',
        m : relativeTimeWithPlural,
        mm : relativeTimeWithPlural,
        h : 'годину',
        hh : relativeTimeWithPlural,
        d : 'день',
        dd : relativeTimeWithPlural,
        M : 'місяць',
        MM : relativeTimeWithPlural,
        y : 'рік',
        yy : relativeTimeWithPlural
    },
    // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason
    meridiemParse: /ночі|ранку|дня|вечора/,
    isPM: function (input) {
        return /^(дня|вечора)$/.test(input);
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 4) {
            return 'ночі';
        } else if (hour < 12) {
            return 'ранку';
        } else if (hour < 17) {
            return 'дня';
        } else {
            return 'вечора';
        }
    },
    ordinalParse: /\d{1,2}-(й|го)/,
    ordinal: function (number, period) {
        switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
            case 'w':
            case 'W':
                return number + '-й';
            case 'D':
                return number + '-го';
            default:
                return number;
        }
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

return uk;

})));

} }