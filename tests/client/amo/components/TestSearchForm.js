import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';

import * as actions from 'core/actions';
import * as coreApi from 'core/api';
import {
  SearchFormBase,
  mapDispatchToProps,
  mapStateToProps,
} from 'amo/components/SearchForm';


describe('<SearchForm />', () => {
  const pathname = '/somewhere';
  let api = { clientApp: 'firefox', lang: 'de' };
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
          loadAddon={loadAddon} ref={(ref) => { this.root = ref; }} />
      );
    }
  }

  beforeEach(() => {
    router = { push: sinon.spy() };
    loadAddon = sinon.stub();
    api = sinon.stub();
    root = renderIntoDocument(<SearchFormWrapper />).root;
    form = root.form;
    input = root.searchQuery.input;
  });

  it('renders a form', () => {
    assert.ok(form.classList.contains('SearchForm-form'));
  });

  it('renders a search input', () => {
    assert.equal(input.placeholder, 'Search extensions and themes');
    assert.equal(input.type, 'search');
  });

  it('renders the query', () => {
    assert.equal(input.value, 'foo');
  });

  it('does changes the URL on submit', () => {
    assert(!router.push.called);
    input.value = 'adblock';
    Simulate.submit(form);
    assert(router.push.called);
  });

  it('does nothing on non-Enter keydowns', () => {
    assert(!router.push.called);
    input.value = 'adblock';
    Simulate.keyDown(input, { key: 'A', shiftKey: true });
    assert(!router.push.called);
  });

  it('updates the location on form submit', () => {
    assert(!router.push.called);
    input.value = 'adblock';
    Simulate.click(root.submitButton);
    assert(router.push.called);
  });
});

describe('SearchForm mapStateToProps', () => {
  it('passes the api through', () => {
    const api = { clientApp: 'firefox', lang: 'de', token: 'someauthtoken' };
    assert.deepEqual(mapStateToProps({ foo: 'bar', api }), { api });
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
        assert(dispatch.calledWith(action));
        mockApi.verify();
        mockActions.verify();
      });
  });
});
