module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"he" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "" ],
      "Extension Metadata":[ "" ],
      Screenshots:[ "צילומי מסך" ],
      "About this extension":[ "על אודות הרחבה זו" ],
      "Rate your experience":[ "דירוג החוויה שלך" ],
      Category:[ "קטגוריה" ],
      "Used by":[ "" ],
      Sentiment:[ "" ],
      Back:[ "חזרה" ],
      Submit:[ "שליחה" ],
      "Please enter some text":[ "נא להזין טקסט" ],
      "Write a review":[ "כתיבת סקירה" ],
      "Tell the world why you think this extension is fantastic!":[ "ספרו לעולם מדוע אתם חושבים שהרחבה זו נהדרת!" ],
      "Privacy policy":[ "מדיניות פרטיות" ],
      "Legal notices":[ "מידע משפטי" ],
      "View desktop site":[ "תצוגת אתר שולחני" ],
      "Browse in your language":[ "עיון בשפה שלך" ],
      "Firefox Add-ons":[ "תוספות של Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "צילום מסך %(imageNumber)s מתוך %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "דירוג ממוצע: %(rating)s מתוך 5" ],
      "No ratings":[ "ללא דירוג" ],
      "%(users)s user":[ "משתמש %(users)s",
        "%(users)s משתמשים" ],
      "Log out":[ "התנתקות" ],
      "Log in/Sign up":[ "התחברות/הרשמה" ],
      "Add-ons for Firefox":[ "תוספות עבור Firefox" ],
      "What do you want Firefox to do?":[ "מה ברצונך ש־Firefox יעשה?" ],
      "Block ads":[ "לחסום מודעות" ],
      Screenshot:[ "צילומי מסך" ],
      "Save stuff":[ "לשמור דברים" ],
      "Shop online":[ "" ],
      "Be social":[ "" ],
      "Share stuff":[ "לשתף דברים" ],
      "Browse all extensions":[ "עיון בכל ההרחבות" ],
      "How do you want Firefox to look?":[ "איך ברצונך ש־Firefox יראה?" ],
      Wild:[ "פראי" ],
      Abstract:[ "מופשט" ],
      Fashionable:[ "אפנתי" ],
      Scenic:[ "נופי" ],
      Sporty:[ "ספורטיבי" ],
      Mystical:[ "מיסטי" ],
      "Browse all themes":[ "עיון בכל ערכות הנושא" ],
      "Downloading %(name)s.":[ "%(name)s בהורדה." ],
      "Installing %(name)s.":[ "%(name)s בהתקנה." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s הותקן והופעל. יש ללחוץ להסרה." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s מנוטרל. יש ללחוץ להפעלה." ],
      "Uninstalling %(name)s.":[ "" ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s הוסר. יש ללחוץ להתקנה." ],
      "Install state for %(name)s is unknown.":[ "מצב ההתקנה של %(name)s אינו ידוע." ],
      Previous:[ "הקודם" ],
      Next:[ "הבא" ],
      "Page %(currentPage)s of %(totalPages)s":[ "עמוד %(currentPage)s מתוך %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "החיפוש שלך עבור \"%(query)s\" החזיר תוצאה אחת.",
        "החיפוש שלך עבור \"%(query)s\" החזיר %(count)s תוצאות." ],
      "Searching...":[ "" ],
      "No results were found for \"%(query)s\".":[ "לא נמצאו תוצאות עבור \"%(query)s\"." ],
      "Please supply a valid search":[ "" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Hebrew [he]
//! author : Tomer Cohen : https://github.com/tomer
//! author : Moshe Simantov : https://github.com/DevelopmentIL
//! author : Tal Ater : https://github.com/TalAter

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var he = moment.defineLocale('he', {
    months : 'ינואר_פברואר_מרץ_אפריל_מאי_יוני_יולי_אוגוסט_ספטמבר_אוקטובר_נובמבר_דצמבר'.split('_'),
    monthsShort : 'ינו׳_פבר׳_מרץ_אפר׳_מאי_יוני_יולי_אוג׳_ספט׳_אוק׳_נוב׳_דצמ׳'.split('_'),
    weekdays : 'ראשון_שני_שלישי_רביעי_חמישי_שישי_שבת'.split('_'),
    weekdaysShort : 'א׳_ב׳_ג׳_ד׳_ה׳_ו׳_ש׳'.split('_'),
    weekdaysMin : 'א_ב_ג_ד_ה_ו_ש'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D [ב]MMMM YYYY',
        LLL : 'D [ב]MMMM YYYY HH:mm',
        LLLL : 'dddd, D [ב]MMMM YYYY HH:mm',
        l : 'D/M/YYYY',
        ll : 'D MMM YYYY',
        lll : 'D MMM YYYY HH:mm',
        llll : 'ddd, D MMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[היום ב־]LT',
        nextDay : '[מחר ב־]LT',
        nextWeek : 'dddd [בשעה] LT',
        lastDay : '[אתמול ב־]LT',
        lastWeek : '[ביום] dddd [האחרון בשעה] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'בעוד %s',
        past : 'לפני %s',
        s : 'מספר שניות',
        m : 'דקה',
        mm : '%d דקות',
        h : 'שעה',
        hh : function (number) {
            if (number === 2) {
                return 'שעתיים';
            }
            return number + ' שעות';
        },
        d : 'יום',
        dd : function (number) {
            if (number === 2) {
                return 'יומיים';
            }
            return number + ' ימים';
        },
        M : 'חודש',
        MM : function (number) {
            if (number === 2) {
                return 'חודשיים';
            }
            return number + ' חודשים';
        },
        y : 'שנה',
        yy : function (number) {
            if (number === 2) {
                return 'שנתיים';
            } else if (number % 10 === 0 && number !== 10) {
                return number + ' שנה';
            }
            return number + ' שנים';
        }
    },
    meridiemParse: /אחה"צ|לפנה"צ|אחרי הצהריים|לפני הצהריים|לפנות בוקר|בבוקר|בערב/i,
    isPM : function (input) {
        return /^(אחה"צ|אחרי הצהריים|בערב)$/.test(input);
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 5) {
            return 'לפנות בוקר';
        } else if (hour < 10) {
            return 'בבוקר';
        } else if (hour < 12) {
            return isLower ? 'לפנה"צ' : 'לפני הצהריים';
        } else if (hour < 18) {
            return isLower ? 'אחה"צ' : 'אחרי הצהריים';
        } else {
            return 'בערב';
        }
    }
});

return he;

})));

} }