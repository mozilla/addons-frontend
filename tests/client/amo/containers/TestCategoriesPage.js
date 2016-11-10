import { mapStateToProps } from 'amo/containers/CategoriesPage';


describe('<CategoriesPage />', () => {
  it('maps state to props', () => {
    const props = mapStateToProps({
      api: { clientApp: 'android', lang: 'pt' },
      categories: {
        categories: { android: {}, firefox: {} },
        error: false,
        loading: true,
      },
    }, {
      params: { addonType: 'themes' },
    });

    assert.deepEqual(props, {
      addonType: 'theme',
      categories: {},
      error: false,
      loading: true,
    });
  });
});
