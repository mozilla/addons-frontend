module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=1; plural=0;",
        lang:"ko" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(startSpan)s%(authorList)s에 의해 제작된%(endSpan)s %(addonName)s" ],
      "Extension Metadata":[ "확장 메타 데이터" ],
      Screenshots:[ "스크린샷" ],
      "About this extension":[ "이 확장 기능에 대해" ],
      "Rate your experience":[ "" ],
      Category:[ "카테고리" ],
      "Used by":[ "" ],
      Sentiment:[ "심리" ],
      Back:[ "뒤로가기" ],
      Submit:[ "제출" ],
      "Please enter some text":[ "텍스트를 입력 해 주시기 바랍니다" ],
      "Write a review":[ "리뷰 작성" ],
      "Tell the world why you think this extension is fantastic!":[ "이 확장 기능이 왜 환상적이라 생각하는지 세상에 알려주세요!" ],
      "Privacy policy":[ "개인정보 보호정책" ],
      "Legal notices":[ "법적 고지 사항" ],
      "View desktop site":[ "데스크톱 사이트 보기" ],
      "Browse in your language":[ "내 언어로 검색" ],
      "Firefox Add-ons":[ "Firefox 부가 기능" ],
      "How are you enjoying your experience with %(addonName)s?":[ "" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "스크린샷 %(totalImages)s 개 중 %(imageNumber)s 번 째" ],
      "Average rating: %(rating)s out of 5":[ "평균 점수: 5 점 중 %(rating)s" ],
      "No ratings":[ "평가 없음" ],
      "%(users)s user":[ "" ],
      "Log out":[ "로그아웃" ],
      "Log in/Sign up":[ "로그인/가입하기" ],
      "Add-ons for Firefox":[ "Firefox 부가 기능" ],
      "What do you want Firefox to do?":[ "" ],
      "Block ads":[ "광고 차단" ],
      Screenshot:[ "스크린샷" ],
      "Save stuff":[ "저장하기" ],
      "Shop online":[ "온라인 쇼핑" ],
      "Be social":[ "" ],
      "Share stuff":[ "공유하기" ],
      "Browse all extensions":[ "모든 확장 기능 탐색하기" ],
      "How do you want Firefox to look?":[ "파이어폭스가 어떻게 보여지길 바라십니까?" ],
      Wild:[ "거친" ],
      Abstract:[ "추상적인" ],
      Fashionable:[ "멋있는" ],
      Scenic:[ "경치가 좋은" ],
      Sporty:[ "활발한" ],
      Mystical:[ "신비로운" ],
      "Browse all themes":[ "모든 테마 탐색하기" ],
      "Downloading %(name)s.":[ "%(name)s를 다운로드하는 중입니다." ],
      "Installing %(name)s.":[ "%(name)s를 설치하는 중입니다." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s가 설치되었고 활성화되었습니다. 제거하려면 클릭하세요." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s가 비활성되었습니다. 활성화하려면 클릭하세요." ],
      "Uninstalling %(name)s.":[ "%(name)s를 제거하는중입니다." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s가 제거되었습니다. 설치하시려면 클릭하세요." ],
      "Install state for %(name)s is unknown.":[ "%(name)s의 설치 상태를 알 수 없습니다." ],
      Previous:[ "이전" ],
      Next:[ "다음" ],
      "Page %(currentPage)s of %(totalPages)s":[ "%(totalPages)s 페이지 중 %(currentPage)s 번째 페이지" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "\"%(query)s\"에 대한 검색결과가 %(count)s개 있습니다." ],
      "Searching...":[ "검색중..." ],
      "No results were found for \"%(query)s\".":[ "\"%(query)s\"에 대한 검색 결과가 없습니다." ],
      "Please supply a valid search":[ "유효한 검색어를 입력해 주세요" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Korean [ko]
//! author : Kyungwook, Park : https://github.com/kyungw00k
//! author : Jeeeyul Lee <jeeeyul@gmail.com>

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var ko = moment.defineLocale('ko', {
    months : '1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월'.split('_'),
    monthsShort : '1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월'.split('_'),
    weekdays : '일요일_월요일_화요일_수요일_목요일_금요일_토요일'.split('_'),
    weekdaysShort : '일_월_화_수_목_금_토'.split('_'),
    weekdaysMin : '일_월_화_수_목_금_토'.split('_'),
    longDateFormat : {
        LT : 'A h시 m분',
        LTS : 'A h시 m분 s초',
        L : 'YYYY.MM.DD',
        LL : 'YYYY년 MMMM D일',
        LLL : 'YYYY년 MMMM D일 A h시 m분',
        LLLL : 'YYYY년 MMMM D일 dddd A h시 m분'
    },
    calendar : {
        sameDay : '오늘 LT',
        nextDay : '내일 LT',
        nextWeek : 'dddd LT',
        lastDay : '어제 LT',
        lastWeek : '지난주 dddd LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s 후',
        past : '%s 전',
        s : '몇 초',
        ss : '%d초',
        m : '일분',
        mm : '%d분',
        h : '한 시간',
        hh : '%d시간',
        d : '하루',
        dd : '%d일',
        M : '한 달',
        MM : '%d달',
        y : '일 년',
        yy : '%d년'
    },
    ordinalParse : /\d{1,2}일/,
    ordinal : '%d일',
    meridiemParse : /오전|오후/,
    isPM : function (token) {
        return token === '오후';
    },
    meridiem : function (hour, minute, isUpper) {
        return hour < 12 ? '오전' : '오후';
    }
});

return ko;

})));

} }