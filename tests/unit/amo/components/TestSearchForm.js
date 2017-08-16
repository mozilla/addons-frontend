import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';

import { setViewContext } from 'amo/actions/viewContext';
import {
  SearchFormBase,
  mapStateToProps,
} from 'amo/components/SearchForm';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('<SearchForm />', () => {
  const pathname = '/search/';
  const api = { clientApp: 'firefox', lang: 'de' };
  let router;
  let root;
  let form;
  let input;

  class SearchFormWrapper extends React.Component {
    static childContextTypes = {
      router: React.PropTypes.object,
    }

    getChildContext() {
      return { router };
    }

    render() {
      return (
        <SearchFormBase
          pathname={pathname}
          api={api}
          query="foo"
          ref={(ref) => { this.root = ref; }}
          i18n={getFakeI18nInst()}
          {...this.props}
        />
      );
    }
  }

  beforeEach(() => {
    router = { push: sinon.spy() };
    root = renderIntoDocument(<SearchFormWrapper />).root;
    form = root.form;
    input = root.searchQuery.input;
  });

  it('renders a form', () => {
    expect(form.classList.contains('SearchForm-form')).toBeTruthy();
  });

  it('renders a search input with Explore placeholder', () => {
    expect(input.placeholder).toEqual('Search extensions and themes');
    expect(input.type).toEqual('search');
  });

  it('renders Extensions placeholder', () => {
    root = renderIntoDocument(
      <SearchFormWrapper addonType={ADDON_TYPE_EXTENSION} />).root;
    input = root.searchQuery.input;

    expect(input.placeholder).toEqual('Search extensions');
    expect(input.type).toEqual('search');
  });

  it('renders Themes placeholder', () => {
    root = renderIntoDocument(
      <SearchFormWrapper addonType={ADDON_TYPE_THEME} />).root;
    input = root.searchQuery.input;

    expect(input.placeholder).toEqual('Search themes');
    expect(input.type).toEqual('search');
  });

  it('renders the query', () => {
    expect(input.value).toEqual('foo');
  });

  it('changes the URL on submit', () => {
    sinon.assert.notCalled(router.push);
    input.value = 'adblock';
    Simulate.submit(form);
    sinon.assert.called(router.push);
  });

  it('blurs the form on submit', () => {
    const blurSpy = sinon.stub(input, 'blur');
    expect(!blurSpy.called).toBeTruthy();
    input.value = 'something';
    Simulate.submit(form);
    sinon.assert.called(blurSpy);
  });

  it('does nothing on non-Enter keydowns', () => {
    sinon.assert.notCalled(router.push);
    input.value = 'adblock';
    Simulate.keyDown(input, { key: 'A', shiftKey: true });
    sinon.assert.notCalled(router.push);
  });

  it('updates the location on form submit', () => {
    sinon.assert.notCalled(router.push);
    input.value = 'adblock';
    Simulate.click(root.submitButton);
    sinon.assert.called(router.push);
  });

  it('passes addonType when set', () => {
    root = renderIntoDocument(
      <SearchFormWrapper addonType={ADDON_TYPE_EXTENSION} />
    ).root;
    form = root.form;
    input = root.searchQuery.input;

    sinon.assert.notCalled(router.push);
    input.value = '& 26 %';
    Simulate.click(root.submitButton);
    sinon.assert.calledWith(router.push, {
      pathname: '/de/firefox/search/',
      query: { q: '& 26 %', type: ADDON_TYPE_EXTENSION },
    });
  });

  it('does not set type when it is not defined', () => {
    sinon.assert.notCalled(router.push);
    input.value = 'searching';
    Simulate.click(root.submitButton);
    sinon.assert.calledWith(router.push, {
      pathname: '/de/firefox/search/',
      query: { q: 'searching' },
    });
  });

  it('encodes the value of the search text', () => {
    sinon.assert.notCalled(router.push);
    input.value = '& 26 %';
    Simulate.click(root.submitButton);
    sinon.assert.calledWith(router.push, {
      pathname: '/de/firefox/search/',
      query: { q: '& 26 %' },
    });
  });
});

describe('SearchForm mapStateToProps', () => {
  it('passes the api through', () => {
    const { store } = dispatchSignInActions();

    const state = store.getState();

    expect(mapStateToProps(state).api).toEqual(state.api);
  });

  it('passes the context through', () => {
    const { store } = dispatchSignInActions();
    store.dispatch(setViewContext(ADDON_TYPE_EXTENSION));

    const state = store.getState();

    expect(mapStateToProps(state).addonType).toEqual(ADDON_TYPE_EXTENSION);
  });

  it('does not set addonType if context is not a validAddonType', () => {
    const { store } = dispatchSignInActions();
    store.dispatch(setViewContext(VIEW_CONTEXT_HOME));

    const state = store.getState();

    expect(mapStateToProps(state).addonType).toEqual(null);
  });
});
