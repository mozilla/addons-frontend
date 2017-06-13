import React from 'react';
import { shallow } from 'enzyme';

import AddonsCard from 'amo/components/AddonsCard';
import SearchResult from 'amo/components/SearchResult';


describe('<AddonsCard />', () => {
  let addons;

  function render(props = {}) {
    return shallow(<AddonsCard {...props} />);
  }

  beforeAll(() => {
    addons = [
      { name: 'I am add-on! ', slug: 'i-am-addon' },
      { name: 'I am also add-on!', slug: 'i-am-also-addon' },
    ];
  });

  it('renders add-ons when supplied', () => {
    const root = render({ addons });
    const list = root.childAt(0);

    expect(list.type()).toEqual('ul');
    expect(list.children().map((c) => c.type()))
      .toEqual([SearchResult, SearchResult]);
    expect(list.children().map((c) => c.prop('addon'))).toEqual(addons);
  });

  it('renders children', () => {
    const root = render({ addons, children: (<div>I am content</div>) });
    expect(root.childAt(0).type()).toEqual('div');
    expect(root.childAt(1).type()).toEqual('ul');
  });
});
