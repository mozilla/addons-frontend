import { mapStateToProps } from 'amo/components/CategoryList';
import { ADDON_TYPE_THEME } from 'core/constants';


describe('<CategoryList />', () => {
  it('maps state to props', () => {
    const props = mapStateToProps({
      api: { clientApp: 'android', lang: 'pt' },
      categories: {
        categories: {
          android: {
            [ADDON_TYPE_THEME]: {
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
      params: { visibleAddonType: 'themes' },
    });

    assert.deepEqual(props, {
      addonType: ADDON_TYPE_THEME,
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
