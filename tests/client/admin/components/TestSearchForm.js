import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';

import * as actions from 'core/actions';
import * as coreApi from 'core/api';
import {
  AdminSearchFormBase,
  mapDispatchToProps,
  mapStateToProps,
} from 'admin/components/SearchForm';

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

describe('<AdminSearchForm />', () => {
  const pathname = '/somewhere';
  let api;
  let loadAddon;
  let router;
  let root;
  let form;
  let input;

  class AdminSearchFormWrapper extends React.Component {
    static childContextTypes = {
      router: React.PropTypes.object,
    }

    getChildContext() {
      return { router };
    }

    render() {
      return (<AdminSearchFormBase
        pathname={pathname} api={api}
        loadAddon={loadAddon} ref={(ref) => { this.root = ref; }}
      />);
    }
  }

  beforeEach(() => {
    router = { push: sinon.spy() };
    loadAddon = sinon.stub();
    api = sinon.stub();
    root = renderIntoDocument(<AdminSearchFormWrapper />).root;
    form = root.form;
    input = root.searchQuery;
  });

  it('does nothing on submit', () => {
    expect(!router.push.called).toBeTruthy();
    input.value = 'adblock';
    Simulate.submit(form);
    expect(!router.push.called).toBeTruthy();
  });

  it('updates the location on enter', () => {
    expect(!router.push.called).toBeTruthy();
    input.value = 'adblock';
    Simulate.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(router.push.calledWith('/somewhere?q=adblock')).toBeTruthy();
  });

  it('looks up the add-on to see if you are lucky', () => {
    loadAddon.returns(Promise.resolve('adblock'));
    input.value = 'adblock@adblock.com';
    Simulate.click(root.go);
    expect(loadAddon.calledWith({ api, query: 'adblock@adblock.com' })).toBeTruthy();
  });

  it('looks up the add-on to see if you are lucky on Shift+Enter', () => {
    loadAddon.returns(Promise.resolve('adblock'));
    input.value = 'adblock@adblock.com';
    Simulate.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(loadAddon.calledWith({ api, query: 'adblock@adblock.com' })).toBeTruthy();
  });

  it('redirects to the add-on if you are lucky', () => {
    loadAddon.returns(Promise.resolve('adblock'));
    expect(!router.push.called).toBeTruthy();
    input.value = 'adblock@adblock.com';
    Simulate.click(root.go);
    return wait(1)
      .then(() => expect(router.push.calledWith('/search/addons/adblock')).toBeTruthy());
  });

  it('searches if it is not found', () => {
    loadAddon.returns(Promise.reject());
    input.value = 'adblock@adblock.com';
    Simulate.click(root.go);
    return wait(1)
      .then(() => expect(router.push.calledWith('/somewhere?q=adblock@adblock.com')).toBeTruthy());
  });
});

describe('SearchForm mapStateToProps', () => {
  it('passes the api through', () => {
    const api = { lang: 'de', token: 'someauthtoken' };
    expect(mapStateToProps({ foo: 'bar', api })).toEqual({ api });
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
