import * as React from 'react';

import HomeHeroBanner, {
  AB_HOME_HERO_EXPERIMENT,
  AB_HOME_HERO_VARIANT_A,
  AB_HOME_HERO_VARIANT_B,
  HomeHeroBannerBase,
} from 'amo/components/HomeHeroBanner';
import Hero from 'ui/components/Hero';
import {
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const defaultProps = {
    _config: getFakeConfig({
      experiments: {
        [AB_HOME_HERO_EXPERIMENT]: true,
      },
    }),
    i18n: fakeI18n(),
    store: dispatchClientMetadata().store,
  };

  function render(props) {
    return shallowUntilTarget(
      <HomeHeroBanner {...defaultProps} {...props} />,
      HomeHeroBannerBase,
    );
  }

  it('renders a HomeHeroBanner', () => {
    const root = render();
    expect(root).toHaveClassName('HomeHeroBanner');
  });

  it('renders with the "small" experiment classname', () => {
    const root = render({ variant: AB_HOME_HERO_VARIANT_A });
    expect(root).toHaveClassName('HomeHeroBanner--small');
  });

  it('renders without the "small" experiment classname', () => {
    const root = render({ variant: AB_HOME_HERO_VARIANT_B });
    expect(root).not.toHaveClassName('HomeHeroBanner--small');
  });

  it('renders a carousel with random sections', () => {
    const root = render();
    const carousel = root.find(Hero);

    expect(carousel).toHaveLength(1);
    expect(carousel).toHaveProp('random', true);
  });
});
