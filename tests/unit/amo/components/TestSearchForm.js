import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';

import { setCurrentView } from 'amo/actions/currentView';
import {
  SearchFormBase,
  mapDispatchToProps,
  mapStateToProps,
} from 'amo/components/SearchForm';
import createStore from 'amo/store';
import * as actions from 'core/actions';
import * as coreApi from 'core/api';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import { getFakeI18nInst, userAuthToken } from 'tests/unit/helpers';


describe('<SearchForm />', () => {
  const pathname = '/search/';
  const api = { clientApp: 'firefox', lang: 'de' };
  let loadAddon;
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
        <SearchFormBase pathname={pathname} api={api} query="foo"
          loadAddon={loadAddon} ref={(ref) => { this.root = ref; }}
          i18n={getFakeI18nInst()} {...this.props} />
      );
    }
  }

  beforeEach(() => {
    router = { push: sinon.spy() };
    loadAddon = sinon.stub();
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
    expect(!router.push.called).toBeTruthy();
    input.value = 'adblock';
    Simulate.submit(form);
    expect(router.push.called).toBeTruthy();
  });

  it('blurs the form on submit', () => {
    const blurSpy = sinon.stub(input, 'blur');
    expect(!blurSpy.called).toBeTruthy();
    input.value = 'something';
    Simulate.submit(form);
    expect(blurSpy.called).toBeTruthy();
  });

  it('does nothing on non-Enter keydowns', () => {
    expect(!router.push.called).toBeTruthy();
    input.value = 'adblock';
    Simulate.keyDown(input, { key: 'A', shiftKey: true });
    expect(!router.push.called).toBeTruthy();
  });

  it('updates the location on form submit', () => {
    expect(!router.push.called).toBeTruthy();
    input.value = 'adblock';
    Simulate.click(root.submitButton);
    expect(router.push.called).toBeTruthy();
  });

  it('passes addonType when set', () => {
    root = renderIntoDocument(
      <SearchFormWrapper addonType={ADDON_TYPE_EXTENSION} />
    ).root;
    form = root.form;
    input = root.searchQuery.input;

    expect(!router.push.called).toBeTruthy();
    input.value = '& 26 %';
    Simulate.click(root.submitButton);
    expect(router.push.calledWith({
      pathname: '/de/firefox/search/',
      query: { q: '& 26 %', type: ADDON_TYPE_EXTENSION },
    })).toBeTruthy();
  });

  it('encodes the value of the search text', () => {
    expect(!router.push.called).toBeTruthy();
    input.value = '& 26 %';
    Simulate.click(root.submitButton);
    expect(router.push.calledWith({
      pathname: '/de/firefox/search/',
      query: { q: '& 26 %', type: undefined },
    })).toBeTruthy();
  });
});

describe('SearchForm mapStateToProps', () => {
  it('passes the api through', () => {
    const { store } = createStore();
    store.dispatch(actions.setAuthToken(userAuthToken()));
    store.dispatch(actions.setClientApp('firefox'));
    store.dispatch(actions.setLang('de'));
    store.dispatch(setCurrentView({ addonType: 'cool' }));

    const state = store.getState();

    expect(mapStateToProps(state)).toEqual({
      addonType: state.currentView.addonType,
      api: state.api,
    });
  });
});

describe('SearchForm loadAddon', () => {
  it('fetches the add-on', () => {
    const slug = 'the-slug';
    const api = { token: 'foo' };
    const dispatch = sinon.stub();
    const addon = sinon.stub();
    const entities = { [slug]: addon };
    const mockApi = sinon.mock(coreApi);
    mockApi
      .expects('fetchAddon')
      .once()
      .withArgs({ slug, api })
      .returns(Promise.resolve({ entities }));
    const action = sinon.stub();
    const mockActions = sinon.mock(actions);
    mockActions
      .expects('loadEntities')
      .once()
      .withArgs(entities)
      .returns(action);
    const { loadAddon } = mapDispatchToProps(dispatch);
    return loadAddon({ api, query: slug })
      .then(() => {
        expect(dispatch.calledWith(action)).toBeTruthy();
        mockApi.verify();
        mockActions.verify();
      });
  });
});
