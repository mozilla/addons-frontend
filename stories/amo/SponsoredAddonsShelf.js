/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import { SponsoredAddonsShelfBase } from 'amo/components/SponsoredAddonsShelf';
import { ErrorHandler } from 'core/errorHandler';
import { createInternalAddon } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
} from 'tests/unit/helpers';
import type { InternalProps as SponsoredAddonsShelfProps } from 'amo/components/SponsoredAddonsShelf';

import Provider from '../setup/Provider';

const lang = 'en-US';
const render = (moreProps: $Shape<SponsoredAddonsShelfProps> = {}) => {
  const props = {
    resultsLoaded: true,
    shelves: {},
    ...moreProps,
  };
  return (
    <SponsoredAddonsShelfBase
      dispatch={dispatchClientMetadata().store.dispatch}
      errorHandler={new ErrorHandler({ id: 'some-id' })}
      i18n={fakeI18n({ includeJedSpy: false })}
      {...props}
    />
  );
};

storiesOf('SponsoredAddonsShelf', module)
  .addParameters({ component: SponsoredAddonsShelfBase })
  .addDecorator((story) => (
    <div className="SponsoredAddonsShelf--storybook">
      <Provider story={story()} />
    </div>
  ))
  .addWithChapters('all variants', {
    chapters: [
      {
        sections: [
          {
            title: 'loading',
            sectionFn: () => render({ isLoading: true, resultsLoaded: false }),
          },
          {
            title: 'with 3 add-ons',
            sectionFn: () =>
              render({
                shelves: {
                  promotedExtensions: Array(3).fill(
                    createInternalAddon(fakeAddon, lang),
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
                    createInternalAddon(fakeAddon, lang),
                  ),
                },
              }),
          },
        ],
      },
    ],
  });
