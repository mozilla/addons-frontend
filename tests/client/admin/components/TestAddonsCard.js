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
    expect(typeof root.props.children[0]).toEqual('undefined');
    expect(list.type).toEqual('ul');
    expect(list.props.children.map((c) => c.type)).toEqual([AdminSearchResult, AdminSearchResult]);
    expect(list.props.children.map((c) => c.props.addon)).toEqual(addons);
  });

  it('renders children', () => {
    const root = render({ addons, children: (<div>I am content</div>) });
    const list = root.props.children[1];
    expect(root.props.children[0].type).toEqual('div');
    expect(list.type).toEqual('ul');
    expect(list.props.children.map((c) => c.type)).toEqual([AdminSearchResult, AdminSearchResult]);
    expect(list.props.children.map((c) => c.props.addon)).toEqual(addons);
  });
});
