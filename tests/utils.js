import { createRenderer } from 'react-addons-test-utils';

export function shallowRender(stuff) {
  const renderer = createRenderer();
  renderer.render(stuff);
  return renderer.getRenderOutput();
}

export function findByTag(root, tag) {
  const matches = root.props.children.filter((child) => child.type === tag);
  assert.equal(matches.length, 1, 'expected one match');
  return matches[0];
}
