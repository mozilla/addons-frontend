/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { createHeroShelves, fakeAddon, fakeI18n } from 'tests/unit/helpers';

import { HeroRecommendationBase } from 'amo/components/HeroRecommendation';
import { createInternalHeroShelves } from 'amo/reducers/home';

import Provider from '../setup/Provider';

const render = (moreProps = {}) => {
  const props = {
    shelfData: createInternalHeroShelves(
      createHeroShelves({
        primaryProps: {
          addon: { ...fakeAddon, name: 'Forest Preserve Nougat (beta)' },
          description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit,
      sed do eiusmod tempor incididunt ut labore et dolore magna
      aliqua. Sed augue lacus viverra vitae.`,
        },
      }),
    ).primary,
    i18n: fakeI18n({ includeJedSpy: false }),
    ...moreProps,
  };
  return <HeroRecommendationBase {...props} />;
};

storiesOf('HeroRecommendation', module)
  .addDecorator((story) => (
    <div className="HeroRecommendation--storybook">
      <Provider story={story()} />
    </div>
  ))
  .add('default', () => {
    return render();
  });
