module.exports = { domain:"messages",
  locale_data:{ messages:{ "":{ domain:"messages",
        plural_forms:"nplurals=2; plural=(n > 1);",
        lang:"fr" },
      "%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s":[ "%(addonName)s %(startSpan)spar %(authorList)s%(endSpan)s" ],
      "Extension Metadata":[ "Métadonnées de l’extension" ],
      Screenshots:[ "Captures d’écran" ],
      "About this extension":[ "Informations sur cette extension" ],
      "Rate your experience":[ "Évaluez votre expérience" ],
      Category:[ "Catégorie" ],
      "Used by":[ "Utilisé par" ],
      Sentiment:[ "Impression" ],
      Back:[ "Retour" ],
      Submit:[ "Envoyer" ],
      "Please enter some text":[ "Veuillez saisir du texte" ],
      "Write a review":[ "Rédigez un avis" ],
      "Tell the world why you think this extension is fantastic!":[ "Expliquez publiquement pourquoi vous trouvez cette extension exceptionnelle." ],
      "Privacy policy":[ "Confidentialité" ],
      "Legal notices":[ "Mentions légales" ],
      "View desktop site":[ "Afficher la version pour ordinateur" ],
      "Browse in your language":[ "Naviguez dans votre langue" ],
      "Firefox Add-ons":[ "Modules Firefox" ],
      "How are you enjoying your experience with %(addonName)s?":[ "Avez-vous apprécié votre usage de %(addonName)s&nbsp;?" ],
      "screenshot %(imageNumber)s of %(totalImages)s":[ "capture d’écran %(imageNumber)s sur %(totalImages)s" ],
      "Average rating: %(rating)s out of 5":[ "Note moyenne : %(rating)s sur 5" ],
      "No ratings":[ "Aucune note" ],
      "%(users)s user":[ "%(users)s utilisateur",
        "%(users)s utilisateurs" ],
      "Log out":[ "Se déconnecter" ],
      "Log in/Sign up":[ "Se connecter/S’inscrire" ],
      "Add-ons for Firefox":[ "Modules pour Firefox" ],
      "What do you want Firefox to do?":[ "Que souhaitez-vous que Firefox soit capable de faire ?" ],
      "Block ads":[ "Bloquer les publicités" ],
      Screenshot:[ "Prendre des captures d’écran" ],
      "Save stuff":[ "Enregistrer des choses" ],
      "Shop online":[ "Effectuer des achats en ligne" ],
      "Be social":[ "Communiquer" ],
      "Share stuff":[ "Partager des choses" ],
      "Browse all extensions":[ "Parcourir toutes les extensions" ],
      "How do you want Firefox to look?":[ "Quelle apparence voulez-vous donner à Firefox ?" ],
      Wild:[ "Sauvage" ],
      Abstract:[ "Abstraite" ],
      Fashionable:[ "Chic" ],
      Scenic:[ "Pittoresque" ],
      Sporty:[ "Sportive" ],
      Mystical:[ "Mystique" ],
      "Browse all themes":[ "Parcourir tous les thèmes" ],
      "Downloading %(name)s.":[ "Téléchargement de %(name)s en cours." ],
      "Installing %(name)s.":[ "Installation de %(name)s en cours." ],
      "%(name)s is installed and enabled. Click to uninstall.":[ "%(name)s est installé et activé. Cliquez pour le désinstaller." ],
      "%(name)s is disabled. Click to enable.":[ "%(name)s est désactivé. Cliquez pour l’activer." ],
      "Uninstalling %(name)s.":[ "Désinstallation de %(name)s en cours." ],
      "%(name)s is uninstalled. Click to install.":[ "%(name)s est désinstallé. Cliquez pour l’installer." ],
      "Install state for %(name)s is unknown.":[ "L’état d’installation de %(name)s est inconnu." ],
      Previous:[ "Précédent" ],
      Next:[ "Suivant" ],
      "Page %(currentPage)s of %(totalPages)s":[ "Page %(currentPage)s sur %(totalPages)s" ],
      "Your search for \"%(query)s\" returned %(count)s result.":[ "Votre recherche « %(query)s » a renvoyé %(count)s résultat.",
        "Votre recherche « %(query)s » a renvoyé %(count)s résultats." ],
      "Searching...":[ "Recherche…" ],
      "No results were found for \"%(query)s\".":[ "Aucun résultat trouvé pour « %(query)s »." ],
      "Please supply a valid search":[ "Veuillez saisir une recherche valide" ] } },
  _momentDefineLocale:function anonymous() {
//! moment.js locale configuration
//! locale : French [fr]
//! author : John Fischer : https://github.com/jfroffice

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';


var fr = moment.defineLocale('fr', {
    months : 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split('_'),
    monthsShort : 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split('_'),
    monthsParseExact : true,
    weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
    weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
    weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[Aujourd\'hui à] LT',
        nextDay: '[Demain à] LT',
        nextWeek: 'dddd [à] LT',
        lastDay: '[Hier à] LT',
        lastWeek: 'dddd [dernier à] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'dans %s',
        past : 'il y a %s',
        s : 'quelques secondes',
        m : 'une minute',
        mm : '%d minutes',
        h : 'une heure',
        hh : '%d heures',
        d : 'un jour',
        dd : '%d jours',
        M : 'un mois',
        MM : '%d mois',
        y : 'un an',
        yy : '%d ans'
    },
    ordinalParse: /\d{1,2}(er|)/,
    ordinal : function (number) {
        return number + (number === 1 ? 'er' : '');
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

return fr;

})));

} }