import { mapStateToProps } from 'amo/containers/CategoriesPage';


describe('<CategoriesPage />', () => {
  it('maps state to props', () => {
    const props = mapStateToProps({
      api: { clientApp: 'android', lang: 'pt' },
      categories: { categories: [], loading: true },
    }, {
      params: { addonType: 'theme' },
    });

    assert.deepEqual(props, {
      addonType: 'theme',
      categories: [],
      clientApp: 'android',
      loading: true,
    });
  });
});
