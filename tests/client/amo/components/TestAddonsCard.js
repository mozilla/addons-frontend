import React from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import SearchResult from 'amo/components/SearchResult';
import { shallowRender } from 'tests/client/helpers';


describe('<AddonsCard />', () => {
  let addons;

  function render(props = {}) {
    return shallowRender(<AddonsCard {...props} />);
  }

  beforeAll(() => {
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
    expect(list.props.children.map((c) => c.type)).toEqual([SearchResult, SearchResult]);
    expect(list.props.children.map((c) => c.props.addon)).toEqual(addons);
  });

  it('renders children', () => {
    const root = render({ addons, children: (<div>I am content</div>) });
    expect(root.props.children[0].type).toEqual('div');
    expect(root.props.children[1].type).toEqual('ul');
  });
});
