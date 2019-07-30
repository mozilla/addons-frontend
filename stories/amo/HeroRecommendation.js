/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { fakeI18n } from 'tests/unit/helpers';

import { HeroRecommendationBase } from 'amo/components/HeroRecommendation';

const render = (props = {}) => {
  return (
    <HeroRecommendationBase
      i18n={fakeI18n({ includeJedSpy: false })}
      {...props}
    />
  );
};

storiesOf('HeroRecommendation', module).add('default', () => {
  return render({
    heading: 'Forest Preserve Nougat (beta)',
    body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit,
      sed do eiusmod tempor incididunt ut labore et dolore magna
      aliqua. Sed augue lacus viverra vitae.`,
    linkText: 'Get Started',
    linkHref: 'https://forest-preserve-nougat.com/',
  });
});
