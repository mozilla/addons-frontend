/* global document */

import { validThemeActions } from 'core/constants';

export default function themeAction(node, action, _doc = document) {
  if (!validThemeActions.includes(action)) {
    throw new Error('Invalid theme action requested');
  }
  const event = _doc.createEvent('Events');
  event.initEvent(action, true, false);
  node.dispatchEvent(event);
}

export function getThemeData({
id, name, description, headerURL, footerURL, textcolor, accentcolor, author,
}) {
  // This extracts the relevant theme data from the larger add-on data object.
  return { id, name, description, headerURL, footerURL, textcolor, accentcolor, author };
}
