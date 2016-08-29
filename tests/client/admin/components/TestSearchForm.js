import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';

import * as actions from 'core/actions';
import * as coreApi from 'core/api';
import { SearchFormBase, mapDispatchToProps, mapStateToProps }
  from 'admin/components/SearchForm';

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

describe('<SearchForm />', () => {
  const pathname = '/somewhere';
  let api;
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
      return (<SearchFormBase
        pathname={pathname} api={api}
        loadAddon={loadAddon} ref="root"
      />);
    }
  }

  beforeEach(() => {
    router = { push: sinon.spy() };
    loadAddon = sinon.stub();
    api = sinon.stub();
    root = renderIntoDocument(<SearchFormWrapper />).refs.root;
    form = root.refs.form;
    input = root.refs.query;
  });

  it('renders a form', () => {
    assert.ok(form.classList.contains('search-form'));
  });

  it('renders a search input', () => {
    assert.equal(input.placeholder, 'Search');
    assert.equal(input.type, 'search');
  });

  it('does nothing on submit', () => {
    assert(!router.push.called);
    input.value = 'adblock';
    Simulate.submit(form);
    assert(!router.push.called);
  });

  it('does nothing on non-Enter keydowns', () => {
    assert(!router.push.called);
    input.value = 'adblock';
    Simulate.keyDown(input, { key: 'A', shiftKey: true });
    assert(!router.push.called);
  });

  it('updates the location on enter', () => {
    assert(!router.push.called);
    input.value = 'adblock';
    Simulate.keyDown(input, { key: 'Enter', shiftKey: false });
    assert(router.push.calledWith('/somewhere?q=adblock'));
  });

  it('updates the location on search click', () => {
    assert(!router.push.called);
    input.value = 'adblock';
    Simulate.click(root.refs.submit);
    assert(router.push.calledWith('/somewhere?q=adblock'));
  });

  it('looks up the add-on to see if you are lucky', () => {
    loadAddon.returns(Promise.resolve('adblock'));
    input.value = 'adblock@adblock.com';
    Simulate.click(root.refs.go);
    assert(loadAddon.calledWith({ api, query: 'adblock@adblock.com' }));
  });

  it('looks up the add-on to see if you are lucky on Shift+Enter', () => {
    loadAddon.returns(Promise.resolve('adblock'));
    input.value = 'adblock@adblock.com';
    Simulate.keyDown(input, { key: 'Enter', shiftKey: true });
    assert(loadAddon.calledWith({ api, query: 'adblock@adblock.com' }));
  });

  it('redirects to the add-on if you are lucky', () => {
    loadAddon.returns(Promise.resolve('adblock'));
    assert(!router.push.called);
    input.value = 'adblock@adblock.com';
    Simulate.click(root.refs.go);
    return wait(1)
      .then(() => assert(router.push.calledWith('/search/addons/adblock')));
  });

  it('searches if it is not found', () => {
    loadAddon.returns(Promise.reject());
    input.value = 'adblock@adblock.com';
    Simulate.click(root.refs.go);
    return wait(1)
      .then(() => assert(router.push.calledWith('/somewhere?q=adblock@adblock.com')));
  });
});

describe('SearchForm mapStateToProps', () => {
  it('passes the api through', () => {
    const api = { lang: 'de', token: 'someauthtoken' };
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
