/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import { createInternalAddon } from 'core/reducers/addons';
import { PromotedAddonsCardBase } from 'amo/components/PromotedAddonsCard';
import { fakeAddon, fakeI18n } from 'tests/unit/helpers';
import type { InternalProps as PromotedAddonsCardProps } from 'amo/components/PromotedAddonsCard';

import Provider from '../setup/Provider';

const render = (moreProps: $Shape<PromotedAddonsCardProps> = {}) => {
  const props = {
    resultsLoaded: true,
    shelves: {},
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
            sectionFn: () => render({ resultsLoaded: false }),
          },
          {
            title: 'with 3 add-ons',
            sectionFn: () =>
              render({
                shelves: {
                  promotedExtensions: Array(3).fill(
                    createInternalAddon(fakeAddon),
                  ),
                },
              }),
          },
          {
            title: 'with 6 add-ons',
            sectionFn: () =>
              render({
                shelves: {
                  promotedExtensions: Array(6).fill(
                    createInternalAddon(fakeAddon),
                  ),
                },
              }),
          },
        ],
      },
    ],
  });
