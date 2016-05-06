import { validThemeActions } from 'disco/constants';

export default function themeAction(node, action, _doc = document) {
  if (validThemeActions.indexOf(action) === -1) {
    throw new Error('Invalid theme action requested');
  }
  const event = _doc.createEvent('Events');
  event.initEvent(action, true, false);
  node.dispatchEvent(event);
}
