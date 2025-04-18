import createDOMPurify from 'dompurify';

import universalWindow from 'amo/window';

const _purify = createDOMPurify(universalWindow);
_purify.addHook('uponSanitizeElement', (node, data, config) => {
  const _ALLOWED_TAGS = config.ALLOWED_TAGS || [];
  if (
    node.tagName &&
    node.parentNode &&
    node.tagName === 'LI' &&
    !['MENU', 'OL', 'UL'].includes(node.parentNode.tagName) &&
    _ALLOWED_TAGS.includes('ul') &&
    _ALLOWED_TAGS.includes('li')
  ) {
    // If we find a <li> with no <ul>/<ol>/<menu> parent, create one for it.
    // It's not ideal because this might create multiple independent lists for
    // each item, but it's better than creating invalid HTML that would throw
    // the virtual DOM off.
    const oldParent = node.parentNode;
    const newParent = node.ownerDocument.createElement('ul');
    newParent.appendChild(node);
    oldParent.appendChild(newParent);
  }
});

export default _purify;
