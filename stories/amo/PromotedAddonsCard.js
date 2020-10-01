/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import { createInternalPromotedAddonsShelf } from 'amo/reducers/home';
import { PromotedAddonsCardBase } from 'amo/components/PromotedAddonsCard';
import { createInternalAddon } from 'core/reducers/addons';
import {
  fakeAddon,
  fakeI18n,
  fakePromotedAddonsShelf,
} from 'tests/unit/helpers';
import type { InternalProps as PromotedAddonsCardProps } from 'amo/components/PromotedAddonsCard';

import Provider from '../setup/Provider';

const render = (moreProps: $Shape<PromotedAddonsCardProps> = {}) => {
  const props = {
    shelfData: null,
    loading: false,
    ...moreProps,
  };
  return (
    <PromotedAddonsCardBase
      i18n={fakeI18n({ includeJedSpy: false })}
      {...props}
    />
  );
};

storiesOf('PromotedAddonsCard', module)
  .addParameters({ component: PromotedAddonsCardBase })
  .addDecorator((story) => (
    <div className="PromotedAddonsCard--storybook">
      <Provider story={story()} />
    </div>
  ))
  .addWithChapters('all variants', {
    chapters: [
      {
        sections: [
          {
            title: 'loading',
            sectionFn: () => render({ loading: true }),
          },
          {
            title: 'with 3 add-ons',
            sectionFn: () =>
              render({
                shelfData: createInternalPromotedAddonsShelf({
                  ...fakePromotedAddonsShelf,
                  addons: Array(3).fill(createInternalAddon(fakeAddon)),
                }),
              }),
          },
          {
            title: 'with 6 add-ons',
            sectionFn: () =>
              render({
                shelfData: createInternalPromotedAddonsShelf({
                  ...fakePromotedAddonsShelf,
                  addons: Array(6).fill(createInternalAddon(fakeAddon)),
                }),
              }),
          },
        ],
      },
    ],
  });
