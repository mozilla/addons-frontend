/* @flow */
import { THEME_INSTALL } from 'core/constants';

export default function themeInstall(
  node: Node,
  _doc: typeof document = document,
) {
  const event = _doc.createEvent('Events');
  event.initEvent(THEME_INSTALL, true, false);
  node.dispatchEvent(event);
}
