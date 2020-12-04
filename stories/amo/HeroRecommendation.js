/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import {
  createHeroShelves,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
} from 'tests/unit/helpers';
import { HeroRecommendationBase } from 'amo/components/HeroRecommendation';
import { createInternalHeroShelves } from 'amo/reducers/home';
import { ErrorHandler } from 'core/errorHandler';
import { setError } from 'core/actions/errors';
import { createApiError } from 'core/api/index';
import type { InternalProps as HeroRecommendationProps } from 'amo/components/HeroRecommendation';

import Provider from '../setup/Provider';

const render = (
  shelfProps = {},
  moreProps: $Shape<HeroRecommendationProps> = {},
) => {
  const props = {
    errorHandler: new ErrorHandler({ id: 'some-id' }),
    i18n: fakeI18n({ includeJedSpy: false }),
    shelfData: createInternalHeroShelves(
      createHeroShelves({
        primaryProps: {
          addon: { ...fakeAddon, name: 'Forest Preserve Nougat (beta)' },
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse eget rutrum mi. Mauris eleifend sapien ut metus varius, nec vulputate nunc rutrum. Maecenas porttitor tincidunt egestas. Nullam sed massa in.',
          ...shelfProps,
        },
      }),
      'en-US',
    ).primary,
    siteIsReadOnly: false,
    siteNotice: null,
    ...moreProps,
  };
  return <HeroRecommendationBase {...props} />;
};

storiesOf('HeroRecommendation', module)
  .addParameters({ component: HeroRecommendationBase })
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
          {
            title: 'with error',
            sectionFn: () => {
              const { store } = dispatchClientMetadata();
              const errorHandlerId = 'some-id';
              const error = createApiError({
                response: { status: 404 },
                apiURL: 'https://some/api/endpoint',
                jsonResponse: { message: 'Not found' },
              });
              store.dispatch(setError({ id: errorHandlerId, error }));
              const capturedError = store.getState().errors[errorHandlerId];
              const errorHandler = new ErrorHandler({
                id: errorHandlerId,
                dispatch: store.dispatch,
                capturedError,
              });

              return render({}, { errorHandler });
            },
          },
          {
            title: 'loading',
            sectionFn: () => render({}, { shelfData: undefined }),
          },
        ],
      },
    ],
  });
