import React from 'react';

import AddonsCard from 'admin/components/AddonsCard';
import AdminSearchResult from 'admin/components/SearchResult';
import { shallowRender } from 'tests/client/helpers';


describe('<AdminAddonsCard />', () => {
  let addons;

  function render(props = {}) {
    return shallowRender(<AddonsCard {...props} />);
  }

  before(() => {
    addons = [
      { name: 'I am add-on! ', slug: 'i-am-addon' },
      { name: 'I am also add-on!', slug: 'i-am-also-addon' },
    ];
  });

  it('renders add-ons when supplied', () => {
    const root = render({ addons });
    const list = root.props.children[1];
    assert.equal(typeof root.props.children[0], 'undefined');
    assert.equal(list.type, 'ul');
    assert.deepEqual(list.props.children.map((c) => c.type),
      [AdminSearchResult, AdminSearchResult]);
    assert.deepEqual(list.props.children.map((c) => c.props.addon), addons);
  });

  it('renders children', () => {
    const root = render({ addons, children: (<div>I am content</div>) });
    const list = root.props.children[1];
    assert.equal(root.props.children[0].type, 'div');
    assert.equal(list.type, 'ul');
    assert.deepEqual(list.props.children.map((c) => c.type),
      [AdminSearchResult, AdminSearchResult]);
    assert.deepEqual(list.props.children.map((c) => c.props.addon), addons);
  });
});
