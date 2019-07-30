/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { fakeI18n } from 'tests/unit/helpers';

import { HeroRecommendationBase } from 'amo/components/HeroRecommendation';

const render = (moreProps = {}) => {
  const props = {
    body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit,
      sed do eiusmod tempor incididunt ut labore et dolore magna
      aliqua. Sed augue lacus viverra vitae.`,
    heading: 'Forest Preserve Nougat (beta)',
    i18n: fakeI18n({ includeJedSpy: false }),
    linkHref: 'https://forest-preserve-nougat.com/',
    linkText: 'Get Started',
    ...moreProps,
  };
  return <HeroRecommendationBase {...props} />;
};

storiesOf('HeroRecommendation', module).add('default', () => {
  return render();
});
