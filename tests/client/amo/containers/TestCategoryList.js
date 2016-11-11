import { mapStateToProps } from 'amo/containers/CategoryList';


describe('<CategoryList />', () => {
  it('maps state to props', () => {
    const props = mapStateToProps({
      api: { clientApp: 'android', lang: 'pt' },
      categories: {
        categories: {
          android: {
            theme: {
              nature: {
                name: 'Nature',
                slug: 'nature',
              },
            },
          },
          firefox: {},
        },
        error: false,
        loading: true,
      },
    }, {
      params: { addonType: 'themes' },
    });

    assert.deepEqual(props, {
      addonType: 'theme',
      categories: {
        nature: {
          name: 'Nature',
          slug: 'nature',
        },
      },
      error: false,
      loading: true,
    });
  });
});
