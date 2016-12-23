module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"es" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s%(startSpan)s por %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Metadata de la extensión" ],
      Screenshots:[ "Capturas de pantalla" ],
      "About this extension":[ "Sobre esta extensión" ],
      "Rate your experience":[ "Califica tu experiencia" ],
      Category:[ "Categoría" ],
      "Used by":[ "Utilizado por" ],
      Sentiment:[ "Sentimiento" ],
      Back:[ "Atrás" ],
      Submit:[ "Enviar" ],
      "Please enter some text":[ "Por favor, escribe algo" ],
      "Write a review":[ "Escribe un comentario" ],
      "Tell the world why you think this extension is fantastic!":[ "¡Dile al mundo por qué crees que esta extensión es genial!" ],
      "Privacy policy":[ "Política de privacidad" ],
      "Legal notices":[ "Aviso legal" ],
      "View desktop site":[ "Ver en página de escritorio" ],
      "Browse in your language":[ "Navega en tu idioma" ],
      "Firefox Add-ons":[ "Complementos de Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "¿Cuál es tu experiencia con %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "captura de pantalla %(imageNumber)s de %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Valoración media: %(rating)s de 5" ],
      "No ratings":[ "Sin valoraciones" ],
      "%(users)s user":[ "Usuario %(users)s",
        "Usuarios %(users)s" ],
      "Log out":[ "Cerrar sesión" ],
      "Log in/Sign up":[ "Iniciar sesión / Registrarse" ],
      "Add-ons for Firefox":[ "Complementos para Firefox" ],
      "What do you want Firefox to do?":[ "¿Qué quieres que haga Firefox?" ],
      "Block ads":[ "Bloquear publicidad" ],
      Screenshot:[ "Captura de pantalla" ],
      "Save stuff":[ "Guardar cosas" ],
      "Shop online":[ "Comprar en línea" ],
      "Be social":[ "Ser sociable" ],
      "Share stuff":[ "Compartir cosas" ],
      "Browse all extensions":[ "Ver todas las extensiones" ],
      "How do you want Firefox to look?":[ "¿Qué aspecto quieres que tenga Firefox?" ],
      Wild:[ "Salvaje" ],
      Abstract:[ "Abstracto" ],
      Fashionable:[ "Actual" ],
      Scenic:[ "Escénico" ],
      Sporty:[ "Deportivo" ],
      Mystical:[ "Místico" ],
      "Browse all themes":[ "Ver todos los temas" ],
      "Downloading %(name)s.":[ "Descargando %(name)s." ],
      "Installing %(name)s.":[ "Instalando %(name)s." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "Se ha instalado %(name)s y está activo. Haz clic para desinstarlo." ],
      "%(name)s is disabled. Click to enable.":[ "Se ha desactivado %(name)s. Haz clic para activarlo." ],
      "Uninstalling %(name)s.":[ "Desinstalando %(name)s." ],
      "%(name)s is uninstalled. Click to install.":[ "Se ha desinstalado %(name)s. Haz clic para instalar." ],
      "Install state for %(name)s is unknown.":[ "Se desconoce el estado de instalación de %(name)s." ],
      Previous:[ "Anterior" ],
      Next:[ "Siguiente" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Página %(currentPage)s de %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Tu búsqueda \"%(query)s\" obtuvo %(count)s resultado.",
        "Tu búsqueda \"%(query)s\" obtuvo %(count)s resultados." ],
      "Searching...":[ "Buscando..." ],
      "No results were found for \"%(query)s\".":[ "No se encontraron resultados para \"%(query)s\"." ],
      "Please supply a valid search":[ "Por favor, introduce una búsqueda válida" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Spanish [es]
//! author : Julio Napurí : https://github.com/julionc

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var monthsShortDot = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_');
var monthsShort = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_');

var es = moment.defineLocale('es', {
    months : 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
    monthsShort : function (m, format) {
        if (/-MMM-/.test(format)) {
            return monthsShort[m.month()];
        } else {
            return monthsShortDot[m.month()];
        }
    },
    monthsParseExact : true,
    weekdays : 'domingo_lunes_martes_miércoles_jueves_viernes_sábado'.split('_'),
    weekdaysShort : 'dom._lun._mar._mié._jue._vie._sáb.'.split('_'),
    weekdaysMin : 'do_lu_ma_mi_ju_vi_sá'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D [de] MMMM [de] YYYY',
        LLL : 'D [de] MMMM [de] YYYY H:mm',
        LLLL : 'dddd, D [de] MMMM [de] YYYY H:mm'
    },
    calendar : {
        sameDay : function () {
            return '[hoy a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        nextDay : function () {
            return '[mañana a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        nextWeek : function () {
            return 'dddd [a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        lastDay : function () {
            return '[ayer a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        lastWeek : function () {
            return '[el] dddd [pasado a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : 'en %s',
        past : 'hace %s',
        s : 'unos segundos',
        m : 'un minuto',
        mm : '%d minutos',
        h : 'una hora',
        hh : '%d horas',
        d : 'un día',
        dd : '%d días',
        M : 'un mes',
        MM : '%d meses',
        y : 'un año',
        yy : '%d años'
    },
    ordinalParse : /\d{1,2}º/,
    ordinal : '%dº',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return es;

})));

} }