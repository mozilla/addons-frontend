import { mapStateToProps } from 'search/containers/CurrentSearchPage';

describe('CurrentSearchPage.mapStateToProps', () => {
  const props = mapStateToProps({
    addons: {ab: {slug: 'ab', title: 'ad-block'},
             cd: {slug: 'cd', title: 'cd-block'}},
    search: {query: 'ad-block'},
  });

  it('passes the query through', () => {
    assert.equal(props.query, 'ad-block');
  });

  it('filters the add-ons', () => {
    assert.deepEqual(props.results, [{slug: 'ab', title: 'ad-block'}]);
  });
});
