import { mapStateToProps, setAddonType } from 'amo/containers/ExtensionsPage';


describe('ExtensionsPage mapStateToProps()', () => {
  it('sets the props', () => {
    const state = {
      featured: { results: 'featured' },
      highlyRated: { results: 'high' },
      popular: { results: 'pop' },
    };
    assert.deepEqual(mapStateToProps(state), {
      featuredAddons: 'featured',
      highlyRatedAddons: 'high',
      popularAddons: 'pop',
    });
  });
});

describe('ExtensionsPage setAddonType()', () => {
  it('sets the addonType', () => {
    const ownProps = { params: { addonType: 'themes' } };
    assert.deepEqual(setAddonType(null, ownProps), { addonType: 'theme' });
  });
});
