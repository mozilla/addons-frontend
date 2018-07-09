import * as React from 'react';
import { shallow } from 'enzyme';

import FeaturedCollectionCard from 'amo/components/FeaturedCollectionCard';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon } from 'tests/unit/amo/helpers';
import { INSTALL_SOURCE_FEATURED_COLLECTION } from 'core/constants';

describe(__filename, () => {
  function render(customProps = {}) {
    const props = {
      addons: [],
      className: 'SomeClass',
      collectionMetadata: {
        footerText: 'Footer text',
        header: 'Header text',
        slug: 'some-slug',
        username: 'some-username',
      },
      loading: false,
      ...customProps,
    };

    return shallow(<FeaturedCollectionCard {...props} />);
  }

  it('sets addonInstallSource on LandingAddonsCard', () => {
    const root = render();

    expect(root.find(LandingAddonsCard)).toHaveProp(
      'addonInstallSource',
      INSTALL_SOURCE_FEATURED_COLLECTION,
    );
  });

  it('passes addons to LandingAddonsCard', () => {
    const addons = [
      createInternalAddon({
        ...fakeAddon,
        slug: 'custom-addon',
      }),
    ];
    const root = render({ addons });
    expect(root.find(LandingAddonsCard)).toHaveProp('addons', addons);
  });

  it('passes loading parameter to LandingAddonsCard', () => {
    const root = render({ loading: true });
    expect(root.find(LandingAddonsCard)).toHaveProp('loading', true);
  });

  it('passes className to LandingAddonsCard', () => {
    const className = 'CustomClass';

    const root = render({ className });
    expect(root.find(LandingAddonsCard)).toHaveProp('className', className);
  });

  it('sets properties on LandingAddonsCard from collectionMetadata', () => {
    const collectionMetadata = {
      footerText: 'Custom footer',
      header: 'Custom header',
      slug: 'custom-slug',
      username: 'custom-username',
    };

    const root = render({ collectionMetadata });
    const landingAddonsCard = root.find(LandingAddonsCard);
    expect(landingAddonsCard).toHaveProp(
      'footerLink',
      `/collections/${collectionMetadata.username}/${collectionMetadata.slug}/`,
    );
    expect(landingAddonsCard).toHaveProp(
      'footerText',
      collectionMetadata.footerText,
    );
    expect(landingAddonsCard).toHaveProp('header', collectionMetadata.header);
  });
});
