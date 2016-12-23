module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n != 1);",
        lang:"it" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s%(startSpan)sdi %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Metadati estensione" ],
      Screenshots:[ "Screenshot" ],
      "About this extension":[ "Informazioni sull’estensione" ],
      "Rate your experience":[ "Valuta la tua esperienza utente" ],
      Category:[ "Categoria" ],
      "Used by":[ "Utilizzato da" ],
      Sentiment:[ "Impressione" ],
      Back:[ "Indietro" ],
      Submit:[ "Invia" ],
      "Please enter some text":[ "Scrivi qualcosa" ],
      "Write a review":[ "Scrivi una recensione" ],
      "Tell the world why you think this extension is fantastic!":[ "Spiega agli altri utenti i motivi per cui apprezzi questa estensione." ],
      "Privacy policy":[ "Informativa sulla privacy" ],
      "Legal notices":[ "Note legali" ],
      "View desktop site":[ "Visualizza versione desktop" ],
      "Browse in your language":[ "Visualizza nella lingua preferita" ],
      "Firefox Add-ons":[ "Componenti aggiuntivi per Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Come valuti la tua esperienza utente con %(addonName)s?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "screenshot %(imageNumber)s di %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Media valutazioni: %(rating)s su 5" ],
      "No ratings":[ "Nessuna valutazione disponibile" ],
      "%(users)s user":[ "%(users)s utente",
        "%(users)s utenti" ],
      "Log out":[ "Disconnetti" ],
      "Log in/Sign up":[ "Accedi / Registrati" ],
      "Add-ons for Firefox":[ "Componenti aggiuntivi per Firefox" ],
      "What do you want Firefox to do?":[ "Quali funzioni vuoi aggiungere a Firefox?" ],
      "Block ads":[ "Blocco di annunci pubblicitari" ],
      Screenshot:[ "Istantanee schermo" ],
      "Save stuff":[ "Salvataggio di contenuti" ],
      "Shop online":[ "Acquisti online" ],
      "Be social":[ "Integrazione con i social network" ],
      "Share stuff":[ "Condivisione di contenuti" ],
      "Browse all extensions":[ "Esplora tutte le estensioni" ],
      "How do you want Firefox to look?":[ "Che stile vuoi dare a Firefox?" ],
      Wild:[ "Naturalistico" ],
      Abstract:[ "Astratto" ],
      Fashionable:[ "Alla moda" ],
      Scenic:[ "Paesaggistico" ],
      Sporty:[ "Sportivo" ],
      Mystical:[ "Mistico" ],
      "Browse all themes":[ "Esplora tutti i temi" ],
      "Downloading %(name)s.":[ "Download di %(name)s in corso…" ],
      "Installing %(name)s.":[ "Installazione di %(name)s in corso…" ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s è installato e attivo. Puoi disinstallarlo con un clic." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s è disattivato. Puoi riattivarlo con un clic." ],
      "Uninstalling %(name)s.":[ "Disinstallazione di %(name)s in corso." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s è stato disinstallato. Puoi reiinstallarlo con un clic." ],
      "Install state for %(name)s is unknown.":[ "Impossibile determinare lo stato di installazione di %(name)s." ],
      Previous:[ "Precedente" ],
      Next:[ "Successiva" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Pagina %(currentPage)s di %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "La ricerca di “%(query)s” ha restituito %(count)s risultato.",
        "La ricerca di “%(query)s” ha restituito %(count)s risultati." ],
      "Searching...":[ "Ricerca in corso…" ],
      "No results were found for \"%(query)s\".":[ "Nessun risultato per “%(query)s”." ],
      "Please supply a valid search":[ "Inserisci almeno un termine valido per la ricerca" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : Italian [it]
//! author : Lorenzo : https://github.com/aliem
//! author: Mattia Larentis: https://github.com/nostalgiaz

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var it = moment.defineLocale('it', {
    months : 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split('_'),
    monthsShort : 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split('_'),
    weekdays : 'Domenica_Lunedì_Martedì_Mercoledì_Giovedì_Venerdì_Sabato'.split('_'),
    weekdaysShort : 'Dom_Lun_Mar_Mer_Gio_Ven_Sab'.split('_'),
    weekdaysMin : 'Do_Lu_Ma_Me_Gi_Ve_Sa'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[Oggi alle] LT',
        nextDay: '[Domani alle] LT',
        nextWeek: 'dddd [alle] LT',
        lastDay: '[Ieri alle] LT',
        lastWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[la scorsa] dddd [alle] LT';
                default:
                    return '[lo scorso] dddd [alle] LT';
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : function (s) {
            return ((/^[0-9].+$/).test(s) ? 'tra' : 'in') + ' ' + s;
        },
        past : '%s fa',
        s : 'alcuni secondi',
        m : 'un minuto',
        mm : '%d minuti',
        h : 'un\'ora',
        hh : '%d ore',
        d : 'un giorno',
        dd : '%d giorni',
        M : 'un mese',
        MM : '%d mesi',
        y : 'un anno',
        yy : '%d anni'
    },
    ordinalParse : /\d{1,2}º/,
    ordinal: '%dº',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return it;

})));

} }