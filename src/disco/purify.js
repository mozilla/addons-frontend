import createDOMPurify from 'dompurify';

import universalWindow from 'core/window';

const discoPurify = createDOMPurify(universalWindow);

discoPurify.addHook('afterSanitizeAttributes', (node) => {
  // Set all elements owning target to target=_blank
  // and add rel="noopener noreferrer".
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export default discoPurify;
