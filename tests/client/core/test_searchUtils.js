import { mapStateToProps } from 'core/searchUtils';

describe('searchUtils mapStateToProps()', () => {
  const state = {
    api: { lang: 'fr-CA' },
    search: {
      filters: { clientApp: 'firefox', query: 'foo' },
      hasSearchParams: true,
    },
  };

  it('does not search if only clientApp is supplied', () => {
    // clientApp is always supplied and it's not enough to search on, so we
    // don't allow searches on it.
    const props = mapStateToProps(state, { location: { query: { } } });
    assert.deepEqual(props, { hasSearchParams: false });
  });
});
