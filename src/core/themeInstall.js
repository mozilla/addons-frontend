import { validThemeActions } from 'core/constants';

export default function themeAction(node, action, _doc = document) {
  if (!validThemeActions.includes(action)) {
    throw new Error('Invalid theme action requested');
  }
  const event = _doc.createEvent('Events');
  event.initEvent(action, true, false);
  node.dispatchEvent(event);
}

// In theory themeData should be an AddonType but in practice it is
// sometimes a custom made object.
export function getThemeData(themeData) {
  return {
    accentcolor: themeData.accentcolor,
    author: themeData.author,
    category: themeData.category,
    description: themeData.description,
    detailURL: themeData.detailURL,
    footer: themeData.footer,
    footerURL: themeData.footerURL,
    header: themeData.header,
    headerURL: themeData.headerURL,
    iconURL: themeData.iconURL,
    id: themeData.id,
    name: themeData.name,
    previewURL: themeData.previewURL,
    textcolor: themeData.textcolor,
    updateURL: themeData.updateURL,
    version: themeData.version,
  };
}
