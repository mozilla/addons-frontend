import { validThemeActions } from 'disco/constants';

export default function themeAction(node, action, _doc = document) {
  if (!validThemeActions.includes(action)) {
    throw new Error('Invalid theme action requested');
  }
  const event = _doc.createEvent('Events');
  event.initEvent(action, true, false);
  node.dispatchEvent(event);
}

export function getThemeData({ id, name, headerURL, footerURL, textcolor, accentcolor }) {
  // This extracts the relevant theme data from the larger add-on data object.
  return { id, name, headerURL, footerURL, textcolor, accentcolor };
}
