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

  function handleSearch(query, response = Promise.resolve({})) {
    mocks.api.expects('search').withArgs({ query }).once().returns(response);
    return mapDispatchToProps(dispatch).handleSearch(query);
  }

  it('sets the query', () => {
    const searchAction = sinon.stub();
    mocks.actions
      .expects('searchStart')
      .withArgs('DuckDuckGo')
      .once()
      .returns(searchAction);
    return handleSearch('DuckDuckGo').then(() => {
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
      .withArgs({query: 'Yahoo!', entities: {addons: {foo: {}, bar: {}}}, result: ['foo', 'bar']})
      .once()
      .returns(loadAction);
    return handleSearch('Yahoo!', response).then(() => {
      mocks.actions.verify();
      assert(dispatch.calledWith(loadAction), 'expected action to be dispatched');
    });
  });
});
