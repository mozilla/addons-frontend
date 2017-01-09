module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=1; plural=0;",
        lang:"ja" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)s(作者: %(authorList)s)%(endSpan)s" ],
      "Extension Metadata":[ "拡張機能メタデータ" ],
      Screenshots:[ "スクリーンショット" ],
      "About this extension":[ "この拡張機能について" ],
      "Rate your experience":[ "あなたの体験を評価" ],
      Category:[ "カテゴリー" ],
      "Used by":[ "使用者:" ],
      Sentiment:[ "意見" ],
      Back:[ "戻る" ],
      Submit:[ "送信" ],
      "Please enter some text":[ "何か内容を入力してください" ],
      "Write a review":[ "レビューを書く" ],
      "Tell the world why you think this extension is fantastic!":[ "この拡張機能が素晴らしいと思う理由を他の人にも伝えましょう！" ],
      "Privacy policy":[ "プライバシーポリシー" ],
      "Legal notices":[ "法的通知" ],
      "View desktop site":[ "デスクトップサイトを見る" ],
      "Browse in your language":[ "あなたの言語で表示" ],
      "Firefox Add-ons":[ "Firefox Add-ons" ],
      "How are you enjoying your experience with %(addonName)s?":[ "%(addonName)s での体験をどのように楽しんでいますか？" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "%(totalImages)s 枚中 %(imageNumber)s 枚目のスクリーンショット" ],
      "Average rating: %(rating)s out of 5":[ "平均評価: 5 段階中の %(rating)s" ],
      "No ratings":[ "評価がありません" ],
      "%(users)s user":[ "%(users)s 人のユーザー" ],
      "Log out":[ "ログアウト" ],
      "Log in/Sign up":[ "ログイン・登録" ],
      "Add-ons for Firefox":[ "Add-ons for Firefox" ],
      "What do you want Firefox to do?":[ "Firefox にどんなことをして欲しいですか？" ],
      "Block ads":[ "広告をブロック" ],
      Screenshot:[ "スクリーンショット" ],
      "Save stuff":[ "何かの保存" ],
      "Shop online":[ "オンラインショッピング" ],
      "Be social":[ "ソーシャルの活用" ],
      "Share stuff":[ "何かの共有" ],
      "Browse all extensions":[ "すべての拡張機能を見る" ],
      "How do you want Firefox to look?":[ "Firefox をどんなデザインにしたいですか？" ],
      Wild:[ "自然" ],
      Abstract:[ "抽象的" ],
      Fashionable:[ "流行" ],
      Scenic:[ "風景" ],
      Sporty:[ "軽快" ],
      Mystical:[ "神秘的" ],
      "Browse all themes":[ "すべてのテーマを見る" ],
      "Downloading %(name)s.":[ "%(name)s をダウンロードしています。" ],
      "Installing %(name)s.":[ "%(name)s をインストールしています。" ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s はインストールされ有効化されました。削除するにはここをクリック。" ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s は無効化されました。有効化するにはここをクリック。" ],
      "Uninstalling %(name)s.":[ "%(name)s を削除しています。" ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s は削除されました。インストールするにはここをクリック。" ],
      "Install state for %(name)s is unknown.":[ "%(name)s のインストール状態は不明です。" ],
      Previous:[ "前へ" ],
      Next:[ "次へ" ],
      "Page %(currentPage)s of %(totalPages)s":[ "%(totalPages)s ページ中 %(currentPage)s ページ目" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "「%(query)s」を検索したところ %(count)s 件の結果が見つかりました。" ],
      "Searching...":[ "検索中..." ],
      "No results were found for \"%(query)s\".":[ "「%(query)s」の検索結果は見つかりませんでした。" ],
      "Please supply a valid search":[ "検索語を正しく入力してください" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Japanese [ja]
//! author : LI Long : https://github.com/baryon

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var ja = moment.defineLocale('ja', {
    months : '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
    monthsShort : '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
    weekdays : '日曜日_月曜日_火曜日_水曜日_木曜日_金曜日_土曜日'.split('_'),
    weekdaysShort : '日_月_火_水_木_金_土'.split('_'),
    weekdaysMin : '日_月_火_水_木_金_土'.split('_'),
    longDateFormat : {
        LT : 'Ah時m分',
        LTS : 'Ah時m分s秒',
        L : 'YYYY/MM/DD',
        LL : 'YYYY年M月D日',
        LLL : 'YYYY年M月D日Ah時m分',
        LLLL : 'YYYY年M月D日Ah時m分 dddd'
    },
    meridiemParse: /午前|午後/i,
    isPM : function (input) {
        return input === '午後';
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 12) {
            return '午前';
        } else {
            return '午後';
        }
    },
    calendar : {
        sameDay : '[今日] LT',
        nextDay : '[明日] LT',
        nextWeek : '[来週]dddd LT',
        lastDay : '[昨日] LT',
        lastWeek : '[前週]dddd LT',
        sameElse : 'L'
    },
    ordinalParse : /\d{1,2}日/,
    ordinal : function (number, period) {
        switch (period) {
            case 'd':
            case 'D':
            case 'DDD':
                return number + '日';
            default:
                return number;
        }
    },
    relativeTime : {
        future : '%s後',
        past : '%s前',
        s : '数秒',
        m : '1分',
        mm : '%d分',
        h : '1時間',
        hh : '%d時間',
        d : '1日',
        dd : '%d日',
        M : '1ヶ月',
        MM : '%dヶ月',
        y : '1年',
        yy : '%d年'
    }
});

return ja;

})));

} }