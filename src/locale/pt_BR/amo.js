module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n > 1);",
        lang:"pt_BR" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)spor %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Metadados da extensão" ],
      Screenshots:[ "Capturas de tela" ],
      "About this extension":[ "Sobre esta extensão" ],
      "Rate your experience":[ "Avalie a sua experiência" ],
      Category:[ "Categoria" ],
      "Used by":[ "Usado por" ],
      Sentiment:[ "Sentimento" ],
      Back:[ "Voltar" ],
      Submit:[ "Enviar" ],
      "Please enter some text":[ "Por favor, digite algum texto" ],
      "Write a review":[ "Escreva uma análise" ],
      "Tell the world why you think this extension is fantastic!":[ "Diga ao mundo porquê que acha que esta extensão é fantástica!" ],
      "Privacy policy":[ "Política de privacidade" ],
      "Legal notices":[ "Avisos legais" ],
      "View desktop site":[ "Ver site para computadores" ],
      "Browse in your language":[ "Navegue no seu idioma" ],
      "Firefox Add-ons":[ "Extensões do Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Como está desfrutando da sua experiência com %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "captura de tela %(imageNumber)s de %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Média de avaliações: %(rating)s de 5" ],
      "No ratings":[ "Sem avaliações" ],
      "%(users)s user":[ "%(users)s usuário",
        "%(users)s usuários" ],
      "Log out":[ "Sair" ],
      "Log in/Sign up":[ "Entre / Registre-se" ],
      "Add-ons for Firefox":[ "Extensões para o Firefox" ],
      "What do you want Firefox to do?":[ "O que quer que o Firefox faça?" ],
      "Block ads":[ "Bloqueie anúncios" ],
      Screenshot:[ "Captura de tela" ],
      "Save stuff":[ "Salve coisas" ],
      "Shop online":[ "Compre online" ],
      "Be social":[ "Seja social" ],
      "Share stuff":[ "Compartilhe coisas" ],
      "Browse all extensions":[ "Navegue por todas as extensões" ],
      "How do you want Firefox to look?":[ "Como quer que o Firefox se pareça?" ],
      Wild:[ "Selvagem" ],
      Abstract:[ "Abstrato" ],
      Fashionable:[ "Modista" ],
      Scenic:[ "Cênico" ],
      Sporty:[ "Desportivo" ],
      Mystical:[ "Místico" ],
      "Browse all themes":[ "Navegue por todos os temas" ],
      "Downloading %(name)s.":[ "Baixando %(name)s." ],
      "Installing %(name)s.":[ "Instalando %(name)s." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s está instalado e habilitado. Clique para desinstalar." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s está desabilitado. Clique para habilitar." ],
      "Uninstalling %(name)s.":[ "Desinstalando %(name)s." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s está desinstalado. Clique para instalar." ],
      "Install state for %(name)s is unknown.":[ "Estado da instalação de %(name)s é desconhecido." ],
      Previous:[ "Anterior" ],
      Next:[ "Próximo" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Página %(currentPage)s de %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "A sua pesquisa por \"%(query)s\" retornou %(count)s resultado.",
        "A sua pesquisa por \"%(query)s\" retornou %(count)s resultados." ],
      "Searching...":[ "Pesquisando..." ],
      "No results were found for \"%(query)s\".":[ "Nenhum resultado foi encontrados para \"%(query)s\"." ],
      "Please supply a valid search":[ "Por favor, forneça uma pesquisa válida" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Portuguese (Brazil) [pt-br]
//! author : Caio Ribeiro Pereira : https://github.com/caio-ribeiro-pereira

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var ptBr = moment.defineLocale('pt-br', {
    months : 'Janeiro_Fevereiro_Março_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro'.split('_'),
    monthsShort : 'Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez'.split('_'),
    weekdays : 'Domingo_Segunda-feira_Terça-feira_Quarta-feira_Quinta-feira_Sexta-feira_Sábado'.split('_'),
    weekdaysShort : 'Dom_Seg_Ter_Qua_Qui_Sex_Sáb'.split('_'),
    weekdaysMin : 'Dom_2ª_3ª_4ª_5ª_6ª_Sáb'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D [de] MMMM [de] YYYY',
        LLL : 'D [de] MMMM [de] YYYY [às] HH:mm',
        LLLL : 'dddd, D [de] MMMM [de] YYYY [às] HH:mm'
    },
    calendar : {
        sameDay: '[Hoje às] LT',
        nextDay: '[Amanhã às] LT',
        nextWeek: 'dddd [às] LT',
        lastDay: '[Ontem às] LT',
        lastWeek: function () {
            return (this.day() === 0 || this.day() === 6) ?
                '[Último] dddd [às] LT' : // Saturday + Sunday
                '[Última] dddd [às] LT'; // Monday - Friday
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : 'em %s',
        past : '%s atrás',
        s : 'poucos segundos',
        m : 'um minuto',
        mm : '%d minutos',
        h : 'uma hora',
        hh : '%d horas',
        d : 'um dia',
        dd : '%d dias',
        M : 'um mês',
        MM : '%d meses',
        y : 'um ano',
        yy : '%d anos'
    },
    ordinalParse: /\d{1,2}º/,
    ordinal : '%dº'
});

return ptBr;

})));

} }