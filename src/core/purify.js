import createDOMPurify from 'dompurify';
import universalWindow from 'core/window';

const purify = createDOMPurify(universalWindow);
export default purify;

purify.addHook('afterSanitizeAttributes', (node) => {
  // Set all elements owning target to target=_blank
  // and add rel="noreferrer".
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noreferrer');
  }
});
