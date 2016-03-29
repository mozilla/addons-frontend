import * as actions from 'search/actions';
import { mapDispatchToProps, mapStateToProps } from 'search/containers/CurrentSearchPage';
import * as api from 'core/api';

describe('CurrentSearchPage.mapStateToProps', () => {
  const state = {
    addons: {ab: {slug: 'ab', name: 'ad-block'},
             cd: {slug: 'cd', name: 'cd-block'}},
    search: {query: 'ad-block', loading: false, results: [{slug: 'ab', name: 'ad-block'}]},
  };
  const props = mapStateToProps(state);

  it('passes the search state', () => {
    assert.strictEqual(props, state.search);
  });
});

describe('CurrentSearchPage.mapDispatchToProps', () => {
  let dispatch;
  let mocks;

  beforeEach(() => {
    dispatch = sinon.spy();
    mocks = {
      actions: sinon.mock(actions),
      api: sinon.mock(api),
    };
  });

  afterEach(() => {
    Object.keys(mocks).forEach((name) => mocks[name].restore());
  });

  function handleSearch({query, page, response = Promise.resolve({}), expectedPage}) {
    mocks.api.expects('search')
      .withArgs({ page: expectedPage || page, query })
      .once()
      .returns(response);
    return mapDispatchToProps(dispatch).handleSearch(query, page);
  }

  it('sets the query', () => {
    const searchAction = sinon.stub();
    mocks.actions
      .expects('searchStart')
      .withArgs('DuckDuckGo', 5)
      .once()
      .returns(searchAction);
    return handleSearch({query: 'DuckDuckGo', page: 5}).then(() => {
      assert(dispatch.calledWith(searchAction), 'expected action to be dispatched');
      mocks.actions.verify();
    });
  });

  it('sets defaults the page to 1', () => {
    const searchAction = sinon.stub();
    mocks.actions
      .expects('searchStart')
      .withArgs('DuckDuckGo', 1)
      .once()
      .returns(searchAction);
    return handleSearch({query: 'DuckDuckGo', expectedPage: 1}).then(() => {
      assert(dispatch.calledWith(searchAction), 'expected action to be dispatched');
      mocks.actions.verify();
    });
  });

  it('sets the response', () => {
    const loadAction = sinon.stub();
    const response = Promise.resolve({
      entities: {addons: {foo: {}, bar: {}}},
      result: ['foo', 'bar'],
    });
    mocks.actions
      .expects('searchLoad')
      .withArgs({
        query: 'Yahoo!',
        entities: {addons: {foo: {}, bar: {}}},
        page: 3,
        result: ['foo', 'bar']})
      .once()
      .returns(loadAction);
    return handleSearch({query: 'Yahoo!', page: 3, response}).then(() => {
      mocks.actions.verify();
      assert(dispatch.calledWith(loadAction), 'expected action to be dispatched');
    });
  });
});
