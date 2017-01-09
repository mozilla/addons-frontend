module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=1; plural=0;",
        lang:"zh_TW" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ " %(startSpan)s%(authorList)s 開發的%(endSpan)s %(addonName)s" ],
      "Extension Metadata":[ "擴充套件後設資料" ],
      Screenshots:[ "畫面擷圖" ],
      "About this extension":[ "關於此擴充套件" ],
      "Rate your experience":[ "為您的體驗打分數" ],
      Category:[ "分類" ],
      "Used by":[ "可用於" ],
      Sentiment:[ "意見" ],
      Back:[ "返回" ],
      Submit:[ "送出" ],
      "Please enter some text":[ "請輸入文字內容" ],
      "Write a review":[ "撰寫評論" ],
      "Tell the world why you think this extension is fantastic!":[ "告訴這世界為什麼您覺得這套擴充套件超棒！" ],
      "Privacy policy":[ "隱私權保護政策" ],
      "Legal notices":[ "法律條款" ],
      "View desktop site":[ "檢視桌面版網站" ],
      "Browse in your language":[ "用您的語言瀏覽" ],
      "Firefox Add-ons":[ "Firefox 附加元件" ],
      "How are you enjoying your experience with %(addonName)s?":[ "您有多喜歡 %(addonName)s 的使用體驗？" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "畫面截圖第 %(imageNumber)s 張，共 %(totalImages)s 張" ],
      "Average rating: %(rating)s out of 5":[ "平均評價: %(rating)s 分，滿分 5 分" ],
      "No ratings":[ "無評價" ],
      "%(users)s user":[ "%(users)s 位使用者" ],
      "Log out":[ "登出" ],
      "Log in/Sign up":[ "登入/註冊" ],
      "Add-ons for Firefox":[ "Firefox 的附加元件" ],
      "What do you want Firefox to do?":[ "您想要 Firefox 能做什麼？" ],
      "Block ads":[ "封鎖廣告" ],
      Screenshot:[ "畫面擷圖" ],
      "Save stuff":[ "儲存東西" ],
      "Shop online":[ "線上購物" ],
      "Be social":[ "交朋友" ],
      "Share stuff":[ "分享東西" ],
      "Browse all extensions":[ "瀏覽所有擴充套件" ],
      "How do you want Firefox to look?":[ "您想要 Firefox 長成怎樣？" ],
      Wild:[ "狂野" ],
      Abstract:[ "抽象派" ],
      Fashionable:[ "流行" ],
      Scenic:[ "風景圖" ],
      Sporty:[ "運動風" ],
      Mystical:[ "懸疑" ],
      "Browse all themes":[ "瀏覽所有佈景主題" ],
      "Downloading %(name)s.":[ "正在下載 %(name)s。" ],
      "Installing %(name)s.":[ "正在安裝 %(name)s。" ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "已安裝並啟用 %(name)s，點擊移除。" ],
      "%(name)s is disabled. Click to enable.":[ "已停用 %(name)s，點擊啟用。" ],
      "Uninstalling %(name)s.":[ "正在移除 %(name)s。" ],
      "%(name)s is uninstalled. Click to install.":[ "已移除 %(name)s，點擊安裝。" ],
      "Install state for %(name)s is unknown.":[ "%(name)s 的安裝狀態未知。" ],
      Previous:[ "上一個" ],
      Next:[ "下一個" ],
      "Page %(currentPage)s of %(totalPages)s":[ "第 %(currentPage)s 頁，共 %(totalPages)s 頁" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "您搜尋「%(query)s」回傳了 %(count)s 筆結果。" ],
      "Searching...":[ "搜尋中…" ],
      "No results were found for \"%(query)s\".":[ "沒有找到「%(query)s」的相關結果。" ],
      "Please supply a valid search":[ "請提供有效搜尋條件" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Chinese (Taiwan) [zh-tw]
//! author : Ben : https://github.com/ben-lin
//! author : Chris Lam : https://github.com/hehachris

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var zhTw = moment.defineLocale('zh-tw', {
    months : '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
    monthsShort : '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
    weekdays : '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
    weekdaysShort : '週日_週一_週二_週三_週四_週五_週六'.split('_'),
    weekdaysMin : '日_一_二_三_四_五_六'.split('_'),
    longDateFormat : {
        LT : 'Ah點mm分',
        LTS : 'Ah點m分s秒',
        L : 'YYYY年MMMD日',
        LL : 'YYYY年MMMD日',
        LLL : 'YYYY年MMMD日Ah點mm分',
        LLLL : 'YYYY年MMMD日ddddAh點mm分',
        l : 'YYYY年MMMD日',
        ll : 'YYYY年MMMD日',
        lll : 'YYYY年MMMD日Ah點mm分',
        llll : 'YYYY年MMMD日ddddAh點mm分'
    },
    meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '凌晨' || meridiem === '早上' || meridiem === '上午') {
            return hour;
        } else if (meridiem === '中午') {
            return hour >= 11 ? hour : hour + 12;
        } else if (meridiem === '下午' || meridiem === '晚上') {
            return hour + 12;
        }
    },
    meridiem : function (hour, minute, isLower) {
        var hm = hour * 100 + minute;
        if (hm < 600) {
            return '凌晨';
        } else if (hm < 900) {
            return '早上';
        } else if (hm < 1130) {
            return '上午';
        } else if (hm < 1230) {
            return '中午';
        } else if (hm < 1800) {
            return '下午';
        } else {
            return '晚上';
        }
    },
    calendar : {
        sameDay : '[今天]LT',
        nextDay : '[明天]LT',
        nextWeek : '[下]ddddLT',
        lastDay : '[昨天]LT',
        lastWeek : '[上]ddddLT',
        sameElse : 'L'
    },
    ordinalParse: /\d{1,2}(日|月|週)/,
    ordinal : function (number, period) {
        switch (period) {
            case 'd' :
            case 'D' :
            case 'DDD' :
                return number + '日';
            case 'M' :
                return number + '月';
            case 'w' :
            case 'W' :
                return number + '週';
            default :
                return number;
        }
    },
    relativeTime : {
        future : '%s內',
        past : '%s前',
        s : '幾秒',
        m : '1 分鐘',
        mm : '%d 分鐘',
        h : '1 小時',
        hh : '%d 小時',
        d : '1 天',
        dd : '%d 天',
        M : '1 個月',
        MM : '%d 個月',
        y : '1 年',
        yy : '%d 年'
    }
});

return zhTw;

})));

} }