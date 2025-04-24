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
    // Try to use the same <ul> if there are multiple <li> next to each other,
    // otherwise create a new <ul>, it's better than creating invalid HTML that
    // would throw the virtual DOM off anyway.
    const oldParent = node.parentNode;
    const previousElement = node.previousElementSibling;
    const newParent =
      previousElement && previousElement.tagName === 'UL'
        ? previousElement
        : node.ownerDocument.createElement('ul');
    oldParent.insertBefore(newParent, node);
    newParent.appendChild(node);
  }
});

export default _purify;
