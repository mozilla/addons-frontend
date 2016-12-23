module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=1; plural=0;",
        lang:"zh_CN" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)s，作者 %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "扩展元数据" ],
      Screenshots:[ "屏幕截图" ],
      "About this extension":[ "关于此扩展" ],
      "Rate your experience":[ "为您的体验打分" ],
      Category:[ "分类" ],
      "Used by":[ "用户：" ],
      Sentiment:[ "感受" ],
      Back:[ "返回" ],
      Submit:[ "提交" ],
      "Please enter some text":[ "请输入文字内容" ],
      "Write a review":[ "撰写评价" ],
      "Tell the world why you think this extension is fantastic!":[ "告诉这世界为什么您觉得这个附加组件很棒！" ],
      "Privacy policy":[ "隐私政策" ],
      "Legal notices":[ "法律声明" ],
      "View desktop site":[ "查看桌面版网站" ],
      "Browse in your language":[ "切换界面语言" ],
      "Firefox Add-ons":[ "Firefox 附加组件" ],
      "How are you enjoying your experience with %(addonName)s?":[ "使用 %(addonName)s 的感觉如何？" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "屏幕截图 %(imageNumber)s / %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "平均评分：%(rating)s / 5" ],
      "No ratings":[ "无评价" ],
      "%(users)s user":[ "%(users)s 个用户" ],
      "Log out":[ "退出登录" ],
      "Log in/Sign up":[ "登录/注册" ],
      "Add-ons for Firefox":[ "Firefox 附加组件" ],
      "What do you want Firefox to do?":[ "您想用 Firefox 做什么？" ],
      "Block ads":[ "过滤广告" ],
      Screenshot:[ "屏幕截图" ],
      "Save stuff":[ "保存内容" ],
      "Shop online":[ "网上购物" ],
      "Be social":[ "社交" ],
      "Share stuff":[ "分享内容" ],
      "Browse all extensions":[ "浏览所有扩展" ],
      "How do you want Firefox to look?":[ "您喜欢什么风格的 Firefox？" ],
      Wild:[ "狂野" ],
      Abstract:[ "抽象" ],
      Fashionable:[ "时髦" ],
      Scenic:[ "风景" ],
      Sporty:[ "运动" ],
      Mystical:[ "神秘" ],
      "Browse all themes":[ "浏览所有主题" ],
      "Downloading %(name)s.":[ "正在下载 %(name)s。" ],
      "Installing %(name)s.":[ "正在安装 %(name)s。" ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s 现在已安装并启用。单击可卸载。" ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s 现在已禁用。单击可启用。" ],
      "Uninstalling %(name)s.":[ "正在卸载 %(name)s。" ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s 已卸载。点击可再次安装。" ],
      "Install state for %(name)s is unknown.":[ "%(name)s 的安装状态未知。" ],
      Previous:[ "上一页" ],
      Next:[ "下一页" ],
      "Page %(currentPage)s of %(totalPages)s":[ "页面 %(currentPage)s / %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "根据您的关键词”%(query)s“搜索到了 %(count)s 条结果。" ],
      "Searching...":[ "正在搜索..." ],
      "No results were found for \"%(query)s\".":[ "搜索“%(query)s”没有找到结果。" ],
      "Please supply a valid search":[ "请提供有效的搜索关键词" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Chinese (China) [zh-cn]
//! author : suupic : https://github.com/suupic
//! author : Zeno Zeng : https://github.com/zenozeng

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var zhCn = moment.defineLocale('zh-cn', {
    months : '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
    monthsShort : '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
    weekdays : '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
    weekdaysShort : '周日_周一_周二_周三_周四_周五_周六'.split('_'),
    weekdaysMin : '日_一_二_三_四_五_六'.split('_'),
    longDateFormat : {
        LT : 'Ah点mm分',
        LTS : 'Ah点m分s秒',
        L : 'YYYY-MM-DD',
        LL : 'YYYY年MMMD日',
        LLL : 'YYYY年MMMD日Ah点mm分',
        LLLL : 'YYYY年MMMD日ddddAh点mm分',
        l : 'YYYY-MM-DD',
        ll : 'YYYY年MMMD日',
        lll : 'YYYY年MMMD日Ah点mm分',
        llll : 'YYYY年MMMD日ddddAh点mm分'
    },
    meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
    meridiemHour: function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '凌晨' || meridiem === '早上' ||
                meridiem === '上午') {
            return hour;
        } else if (meridiem === '下午' || meridiem === '晚上') {
            return hour + 12;
        } else {
            // '中午'
            return hour >= 11 ? hour : hour + 12;
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
        sameDay : function () {
            return this.minutes() === 0 ? '[今天]Ah[点整]' : '[今天]LT';
        },
        nextDay : function () {
            return this.minutes() === 0 ? '[明天]Ah[点整]' : '[明天]LT';
        },
        lastDay : function () {
            return this.minutes() === 0 ? '[昨天]Ah[点整]' : '[昨天]LT';
        },
        nextWeek : function () {
            var startOfWeek, prefix;
            startOfWeek = moment().startOf('week');
            prefix = this.diff(startOfWeek, 'days') >= 7 ? '[下]' : '[本]';
            return this.minutes() === 0 ? prefix + 'dddAh点整' : prefix + 'dddAh点mm';
        },
        lastWeek : function () {
            var startOfWeek, prefix;
            startOfWeek = moment().startOf('week');
            prefix = this.unix() < startOfWeek.unix()  ? '[上]' : '[本]';
            return this.minutes() === 0 ? prefix + 'dddAh点整' : prefix + 'dddAh点mm';
        },
        sameElse : 'LL'
    },
    ordinalParse: /\d{1,2}(日|月|周)/,
    ordinal : function (number, period) {
        switch (period) {
            case 'd':
            case 'D':
            case 'DDD':
                return number + '日';
            case 'M':
                return number + '月';
            case 'w':
            case 'W':
                return number + '周';
            default:
                return number;
        }
    },
    relativeTime : {
        future : '%s内',
        past : '%s前',
        s : '几秒',
        m : '1 分钟',
        mm : '%d 分钟',
        h : '1 小时',
        hh : '%d 小时',
        d : '1 天',
        dd : '%d 天',
        M : '1 个月',
        MM : '%d 个月',
        y : '1 年',
        yy : '%d 年'
    },
    week : {
        // GB/T 7408-1994《数据元和交换格式·信息交换·日期和时间表示法》与ISO 8601:1988等效
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return zhCn;

})));

} }