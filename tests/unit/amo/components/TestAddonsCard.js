import * as React from 'react';
import { shallow } from 'enzyme';

import AddonsCard from 'amo/components/AddonsCard';
import EditableCollectionAddon from 'amo/components/EditableCollectionAddon';
import SearchResult from 'amo/components/SearchResult';
import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import { fakeAddon } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  let addons;

  function render(props = {}) {
    return shallow(<AddonsCard {...props} />);
  }

  beforeAll(() => {
    addons = [
      { ...fakeAddon, name: 'I am add-on! ', slug: 'i-am-addon' },
      { ...fakeAddon, name: 'I am also add-on!', slug: 'i-am-also-addon' },
    ];
  });

  it('can render a horizontal class', () => {
    const root = render({ type: 'horizontal' });

    expect(root).toHaveClassName('AddonsCard--horizontal');
  });

  it('does not render a horizontal class by default', () => {
    const root = render();

    expect(root).not.toHaveClassName('AddonsCard--horizontal');
  });

  it('renders add-ons when supplied', () => {
    const root = render({ addons });
    const list = root.childAt(0);

    expect(list.type()).toEqual('ul');
    expect(list.children().map((c) => c.type()))
      .toEqual([SearchResult, SearchResult]);
    expect(list.children().map((c) => c.prop('addon'))).toEqual(addons);
  });

  it('renders editable add-ons when supplied and requested', () => {
    const root = render({ addons, editing: true });
    const list = root.childAt(0);

    expect(list.type()).toEqual('ul');
    expect(list.children().map((c) => c.type()))
      .toEqual([EditableCollectionAddon, EditableCollectionAddon]);
    expect(list.children().map((c) => c.prop('addon'))).toEqual(addons);
  });

  it('passes a removeAddon function to editable add-ons', () => {
    const removeAddon = sinon.stub();
    const root = render({ addons, editing: true, removeAddon });
    const list = root.childAt(0);

    expect.assertions(list.children().length);
    list.children().forEach((editableCollectionAddon) => {
      expect(editableCollectionAddon).toHaveProp('removeAddon', removeAddon);
    });
  });

  it('renders children', () => {
    const root = render({ addons, children: (<div>I am content</div>) });
    expect(root.childAt(0).type()).toEqual('div');
    expect(root.childAt(1).type()).toEqual('ul');
  });

  it('renders placeholders when loading addons', () => {
    const root = render({ addons: null, loading: true });
    const results = root.find(SearchResult);
    expect(results).toHaveLength(DEFAULT_API_PAGE_SIZE);
    // Do a quick check to make sure these are rendered as placeholders.
    expect(results.at(0)).not.toHaveProp('addon');
  });

  it('handles an empty set of addons', () => {
    const root = render({ addons: [], loading: false });
    expect(root.find(SearchResult)).toHaveLength(0);
  });

  it('allows you configure the number of placeholders', () => {
    const root = render({
      addons: null, loading: true, placeholderCount: 2,
    });
    expect(root.find(SearchResult)).toHaveLength(2);
  });

  it('renders addons even when loading', () => {
    const root = render({ addons: [fakeAddon], loading: true });
    const results = root.find(SearchResult);
    expect(results).toHaveLength(1);
    expect(results.at(0)).toHaveProp('addon', fakeAddon);
  });

  it('renders search results with addonInstallSource', () => {
    const addonInstallSource = 'featured-on-home-page';
    const root = render({ addons: [fakeAddon], addonInstallSource });

    const results = root.find(SearchResult);
    expect(results.at(0))
      .toHaveProp('addonInstallSource', addonInstallSource);
  });
});
