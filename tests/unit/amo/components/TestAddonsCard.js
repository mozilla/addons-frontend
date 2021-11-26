import * as React from 'react';
import { shallow } from 'enzyme';

import AddonsCard from 'amo/components/AddonsCard';
import EditableCollectionAddon from 'amo/components/EditableCollectionAddon';
import SearchResult from 'amo/components/SearchResult';
import { DEFAULT_API_PAGE_SIZE } from 'amo/api';
import { ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import CardList from 'amo/components/CardList';
import {
  createInternalAddonWithLang,
  createLocalizedString,
  fakeAddon,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let addons;

  function render(customProps = {}) {
    const props = {
      deleteNote: sinon.stub(),
      removeAddon: sinon.stub(),
      saveNote: sinon.stub(),
      ...customProps,
    };
    return shallow(<AddonsCard {...props} />);
  }

  beforeAll(() => {
    addons = [
      {
        ...fakeAddon,
        name: createLocalizedString('I am add-on! '),
        slug: 'i-am-addon',
      },
      {
        ...fakeAddon,
        name: createLocalizedString('I am also add-on!'),
        slug: 'i-am-also-addon',
      },
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
    expect(list.children().map((c) => c.type())).toEqual([
      SearchResult,
      SearchResult,
    ]);
    expect(list.children().map((c) => c.prop('addon'))).toEqual(addons);
  });

  it('renders editable add-ons when supplied and requested', () => {
    const root = render({ addons, editing: true });
    const list = root.childAt(0);

    expect(list.type()).toEqual('ul');
    expect(list.children().map((c) => c.type())).toEqual([
      EditableCollectionAddon,
      EditableCollectionAddon,
    ]);
    expect(list.children().map((c) => c.prop('addon'))).toEqual(addons);
  });

  it('passes expected functions to editable add-ons', () => {
    const deleteNote = sinon.stub();
    const removeAddon = sinon.stub();
    const saveNote = sinon.stub();
    const root = render({
      addons,
      deleteNote,
      editing: true,
      removeAddon,
      saveNote,
    });
    const list = root.childAt(0);

    expect.assertions(list.children().length * 3);
    list.children().forEach((editableCollectionAddon) => {
      expect(editableCollectionAddon).toHaveProp('deleteNote', deleteNote);
      expect(editableCollectionAddon).toHaveProp('removeAddon', removeAddon);
      expect(editableCollectionAddon).toHaveProp('saveNote', saveNote);
    });
  });

  it('renders children', () => {
    const root = render({ addons, children: <div>I am content</div> });
    expect(root.childAt(0).type()).toEqual('div');
    expect(root.childAt(1).type()).toEqual('ul');
  });

  it('renders placeholders when loading addons', () => {
    const root = render({ addons: null, loading: true });
    const results = root.find(SearchResult);
    expect(results).toHaveLength(DEFAULT_API_PAGE_SIZE);
    // Do a quick check to make sure these are rendered as placeholders.
    expect(results.at(0)).not.toHaveProp('addon');
    // By default we do not want "theme" placeholders.
    expect(results.at(0)).toHaveProp('useThemePlaceholder', false);
  });

  it('handles an empty set of addons', () => {
    const root = render({ addons: [], loading: false });
    expect(root.find(SearchResult)).toHaveLength(0);
  });

  it('allows you configure the number of placeholders', () => {
    const root = render({
      addons: null,
      loading: true,
      placeholderCount: 2,
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
    expect(results.at(0)).toHaveProp('addonInstallSource', addonInstallSource);
  });

  it('hides summary for a static theme', () => {
    const newFakeAddon = {
      ...fakeAddon,
      type: ADDON_TYPE_STATIC_THEME,
    };
    const root = render({ addons: [newFakeAddon] });
    const results = root.find(SearchResult);
    expect(results).toHaveLength(1);
    expect(results.at(0)).toHaveProp('showSummary', false);
  });

  it('passes the footer prop through to Card', () => {
    const footer = 'some footer';
    const root = render({ footer });
    expect(root.find(CardList)).toHaveProp('footer', footer);
  });

  it('passes the footerText prop through to Card', () => {
    const footerText = 'some footer text';
    const root = render({ footerText });
    expect(root.find(CardList)).toHaveProp('footerText', footerText);
  });

  it('passes the footerLink prop through to Card', () => {
    const footerLink = 'some footer link';
    const root = render({ footerLink });
    expect(root.find(CardList)).toHaveProp('footerLink', footerLink);
  });

  it('passes the header prop through to Card', () => {
    const header = 'some header';
    const root = render({ header });
    expect(root.find(CardList)).toHaveProp('header', header);
  });

  it('passes the isHomepageShelf prop through to Card', () => {
    const isHomepageShelf = true;
    const root = render({ isHomepageShelf });

    expect(root.find(CardList)).toHaveProp('isHomepageShelf', isHomepageShelf);
  });

  it('passes the showPromotedBadge prop through to SearchResult', () => {
    const showPromotedBadge = false;
    const root = render({ addons: [fakeAddon], showPromotedBadge });
    expect(root.find(SearchResult)).toHaveProp(
      'showPromotedBadge',
      showPromotedBadge,
    );
  });

  it('passes the useThemePlaceholder to the SearchResult placeholders when loading', () => {
    const useThemePlaceholder = true;

    const root = render({ addons: null, loading: true, useThemePlaceholder });

    const results = root.find(SearchResult);
    expect(results.at(0)).toHaveProp(
      'useThemePlaceholder',
      useThemePlaceholder,
    );
  });

  it('passes the custom onAddonClick handler to the SearchResult', () => {
    const onAddonClick = sinon.spy();

    const root = render({
      addons: [createInternalAddonWithLang(fakeAddon)],
      onAddonClick,
    });

    expect(root.find(SearchResult)).toHaveProp('onClick', onAddonClick);
  });

  it('passes the custom onAddonImpression handler to the SearchResult', () => {
    const onAddonImpression = sinon.spy();

    const root = render({
      addons: [createInternalAddonWithLang(fakeAddon)],
      onAddonImpression,
    });

    expect(root.find(SearchResult)).toHaveProp(
      'onImpression',
      onAddonImpression,
    );
  });

  it('passes the showFullSizePreview prop through to SearchResult', () => {
    const showFullSizePreview = true;
    const root = render({ addons: [fakeAddon], showFullSizePreview });
    expect(root.find(SearchResult)).toHaveProp(
      'showFullSizePreview',
      showFullSizePreview,
    );
  });
});
