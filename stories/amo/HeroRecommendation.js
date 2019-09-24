/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { createHeroShelves, fakeAddon, fakeI18n } from 'tests/unit/helpers';

import { HeroRecommendationBase } from 'amo/components/HeroRecommendation';
import { createInternalHeroShelves } from 'amo/reducers/home';

import Provider from '../setup/Provider';

const render = (shelfProps = {}, moreProps = {}) => {
  const props = {
    shelfData: createInternalHeroShelves(
      createHeroShelves({
        primaryProps: {
          addon: { ...fakeAddon, name: 'Forest Preserve Nougat (beta)' },
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse eget rutrum mi. Mauris eleifend sapien ut metus varius, nec vulputate nunc rutrum. Maecenas porttitor tincidunt egestas. Nullam sed massa in.',
          ...shelfProps,
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
  .addWithChapters('all variants', {
    chapters: [
      {
        sections: [
          {
            title: 'with image',
            sectionFn: () => render(),
          },
          {
            title: 'without image',
            sectionFn: () => render({ featuredImage: null }),
          },
        ],
      },
    ],
  });
