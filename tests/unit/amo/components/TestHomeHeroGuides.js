import * as React from 'react';
import { shallow } from 'enzyme';

import HomeHeroGuides, {
  HomeHeroGuidesBase,
} from 'amo/components/HomeHeroGuides';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'core/constants';
import {
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Hero from 'ui/components/Hero';

describe(__filename, () => {
  const render = ({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
    return shallowUntilTarget(
      <HomeHeroGuides store={store} i18n={fakeI18n()} {...props} />,
      HomeHeroGuidesBase,
    );
  };

  it('renders a HomeHeroGuides', () => {
    const root = render();

    expect(root).toHaveClassName('HomeHeroGuides');
    expect(root.find('.HomeHeroGuides-header-title')).toHaveLength(1);
    expect(root.find('.HomeHeroGuides-header-subtitle')).toHaveLength(1);
    expect(root.find('.HomeHeroGuides-header-title').text()).toMatch(
      /Extensions are/,
    );
    expect(root.find('.HomeHeroGuides-header-subtitle').text()).toMatch(
      /They add features/,
    );
  });

  it('renders the hero sections for the firefox app', () => {
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
    });
    const root = render({ store });
    const hero = root.find(Hero);

    expect(hero).toHaveLength(1);
    expect(hero).toHaveProp('sections');
    expect(hero.prop('sections')).toHaveLength(3);

    const firstSection = shallow(hero.prop('sections')[0]);

    expect(firstSection.find('.HeroSection-link-wrapper')).toHaveLength(1);
  });

  it('does not render the hero sections for the android app', () => {
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
    });

    const root = render({ store });
    const hero = root.find(Hero);

    expect(hero).toHaveLength(0);
  });
});
