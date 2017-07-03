import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';

import { setViewContext } from 'amo/actions/viewContext';
import {
  SearchFormBase,
  mapDispatchToProps,
  mapStateToProps,
} from 'amo/components/SearchForm';
import * as actions from 'core/actions';
import * as coreApi from 'core/api';
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
        <SearchFormBase
          pathname={pathname}
          api={api}
          query="foo"
          loadAddon={loadAddon}
          ref={(ref) => { this.root = ref; }}
          i18n={getFakeI18nInst()}
          {...this.props}
        />
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

  it('encodes the value of the search text', () => {
    sinon.assert.notCalled(router.push);
    input.value = '& 26 %';
    Simulate.click(root.submitButton);
    sinon.assert.calledWith(router.push, {
      pathname: '/de/firefox/search/',
      query: { q: '& 26 %', type: undefined },
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
        sinon.assert.calledWith(dispatch, action);
        mockApi.verify();
        mockActions.verify();
      });
  });
});
