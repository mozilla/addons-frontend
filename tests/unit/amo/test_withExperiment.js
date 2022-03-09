import * as React from 'react';

import { storeExperimentVariant } from 'amo/reducers/experiments';
import {
  EXPERIMENT_COOKIE_NAME,
  EXPERIMENT_ENROLLMENT_CATEGORY,
  EXPERIMENT_ID_REGEXP,
  NOT_IN_EXPERIMENT,
  defaultCookieConfig,
  getVariant,
  withExperiment,
} from 'amo/withExperiment';
// eslint-disable-next-line import/namespace
import * as defaultConfig from 'config/default';
import {
  createExperimentData,
  createFakeTrackingWithJest,
  dispatchClientMetadata,
  fakeCookiesWithJest,
  getFakeConfig,
  makeExperimentId,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const SomeComponentBase = ({
    /* eslint-disable react/prop-types */
    experimentId,
    isExperimentEnabled,
    isUserInExperiment,
    variant,
    /* eslint-enable react/prop-types */
  }) => {
    return (
      <div className="component">
        <p>experimentId: {experimentId}</p>
        <p>isExperimentEnabled: {String(isExperimentEnabled)}</p>
        <p>isUserInExperiment: {String(isUserInExperiment)}</p>
        <p>variant: {variant}</p>
      </div>
    );
  };

  const render = ({
    _tracking = createFakeTrackingWithJest(),
    configOverrides = {},
    cookies = fakeCookiesWithJest(),
    experimentProps,
    props,
    store = dispatchClientMetadata().store,
  } = {}) => {
    const id =
      (experimentProps && experimentProps.id) || makeExperimentId('some-id');
    const allExperimentProps = {
      _config: getFakeConfig({
        experiments: {
          // Enable the experiment by default to ease testing.
          [id]: true,
        },
        ...configOverrides,
      }),
      _tracking,
      experimentConfig: {
        id,
        variants: [
          { id: 'some-variant-a', percentage: 0.5 },
          { id: 'some-variant-b', percentage: 0.5 },
        ],
        ...experimentProps,
      },
    };

    const SomeComponent = withExperiment(allExperimentProps)(SomeComponentBase);

    return defaultRender(<SomeComponent cookies={cookies} {...props} />, {
      store,
    });
  };

  it('calls shouldExcludeUser to determine whether the current user should be in the experiment', () => {
    const shouldExcludeUser = jest.fn();
    const { state, store } = dispatchClientMetadata();

    render({
      experimentProps: { shouldExcludeUser },
      store,
    });

    expect(shouldExcludeUser).toHaveBeenCalledWith({
      state: expect.objectContaining({ api: state.api }),
    });
  });

  it.each([true, false])(
    'injects a variant prop from a cookie whether a user is excluded or not',
    (isExcluded) => {
      const shouldExcludeUser = jest.fn().mockReturnValue(isExcluded);
      const id = makeExperimentId('test-id');
      const variantId = 'some-variant-id';
      const cookies = fakeCookiesWithJest({
        get: jest.fn().mockReturnValue(createExperimentData({ id, variantId })),
      });

      render({
        cookies,
        experimentProps: { id, shouldExcludeUser },
      });

      expect(screen.getByText(`variant: ${variantId}`)).toBeInTheDocument();
    },
  );

  it.each([true, false])(
    'injects a variant prop from the redux store whether a user is excluded or not',
    (isExcluded) => {
      const shouldExcludeUser = jest.fn().mockReturnValue(isExcluded);
      const { store } = dispatchClientMetadata();
      const id = makeExperimentId('test-id');
      const variantId = 'some-variant-id';
      const cookies = fakeCookiesWithJest({
        get: jest.fn().mockReturnValue(undefined),
      });

      store.dispatch(storeExperimentVariant({ id, variant: variantId }));

      render({
        cookies,
        experimentProps: { id, shouldExcludeUser },
        store,
      });

      expect(screen.getByText(`variant: ${variantId}`)).toBeInTheDocument();
    },
  );

  // If a cookie exists, we always want to use it, to maintain consistency
  // for the user.
  it('prefers a variant from a cookie to one from the the redux store', () => {
    const { store } = dispatchClientMetadata();
    const id = makeExperimentId('test-id');
    const cookieVariant = 'cookie-variant';
    const storeVariant = 'store-variant';
    const cookies = fakeCookiesWithJest({
      get: jest
        .fn()
        .mockReturnValue(
          createExperimentData({ id, variantId: cookieVariant }),
        ),
    });

    store.dispatch(storeExperimentVariant({ id, variant: storeVariant }));

    render({ cookies, experimentProps: { id }, store });

    expect(screen.getByText(`variant: ${cookieVariant}`)).toBeInTheDocument();
  });

  it('uses an updated cookie value on re-render', () => {
    const id = makeExperimentId('test-id');
    const originalCookieVariant = 'cookie-variant';
    const updatedCookieVariant = 'cookie-variant-updated';
    const cookies = fakeCookiesWithJest({
      get: jest
        .fn()
        .mockReturnValue(
          createExperimentData({ id, variantId: originalCookieVariant }),
        ),
    });

    render({ cookies, experimentProps: { id } });

    expect(
      screen.getByText(`variant: ${originalCookieVariant}`),
    ).toBeInTheDocument();

    render({
      cookies: fakeCookiesWithJest({
        get: sinon
          .stub()
          .returns(
            createExperimentData({ id, variantId: updatedCookieVariant }),
          ),
      }),
      experimentProps: { id },
    });

    expect(
      screen.getByText(`variant: ${updatedCookieVariant}`),
    ).toBeInTheDocument();
  });

  // Test for https://github.com/mozilla/addons-frontend/issues/10681
  it('injects a newly created variant prop', () => {
    const id = makeExperimentId('hero');
    const variantId = 'some-variant-id';
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue(undefined),
    });
    const _getVariant = jest.fn().mockReturnValue(variantId);

    render({
      cookies,
      experimentProps: { id },
      props: { _getVariant },
    });

    expect(screen.getByText(`variant: ${variantId}`)).toBeInTheDocument();
  });

  it('injects a variant prop when shouldExcludeUser is undefined', () => {
    const id = makeExperimentId('hero');
    const variantId = 'some-variant-id';
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue(undefined),
    });
    const _getVariant = jest.fn().mockReturnValue(variantId);

    render({
      cookies,
      experimentProps: { id, shouldExcludeUser: undefined },
      props: { _getVariant },
    });

    expect(screen.getByText(`variant: ${variantId}`)).toBeInTheDocument();
  });

  it('makes the variant NOT_IN_EXPERIMENT if a user should be excluded, and no variant exists (cookie or store)', () => {
    const shouldExcludeUser = jest.fn().mockReturnValue(true);
    render({ experimentProps: { shouldExcludeUser } });

    expect(
      screen.getByText(`variant: ${NOT_IN_EXPERIMENT}`),
    ).toBeInTheDocument();
  });

  it('injects an experimentId', () => {
    const id = makeExperimentId('injected-id');
    render({ experimentProps: { id } });

    expect(screen.getByText(`experimentId: ${id}`)).toBeInTheDocument();
  });

  it('injects an isExperimentEnabled prop', () => {
    render();

    expect(screen.getByText('isExperimentEnabled: true')).toBeInTheDocument();
  });

  it('injects an isUserInExperiment prop', () => {
    const id = makeExperimentId('test-id');
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue(createExperimentData({ id })),
    });

    render({ cookies, experimentProps: { id } });

    expect(screen.getByText('isUserInExperiment: true')).toBeInTheDocument();
  });

  it('reads the experiment cookie upon render', () => {
    const cookies = fakeCookiesWithJest();

    render({ cookies });

    expect(cookies.get).toHaveBeenCalledWith(EXPERIMENT_COOKIE_NAME);
  });

  it('deletes the data for an experiment from the cookie if the experiment is disabled', () => {
    const experimentId = makeExperimentId('thisExperiment');
    const anotherExperimentId = makeExperimentId('anotherExperiment');
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue({
        ...createExperimentData({ id: experimentId }),
        ...createExperimentData({ id: anotherExperimentId }),
      }),
    });
    const configOverrides = {
      experiments: {
        [experimentId]: false,
        [anotherExperimentId]: true,
      },
    };

    render({
      configOverrides,
      cookies,
      experimentProps: { id: experimentId },
    });

    expect(cookies.set).toHaveBeenCalledTimes(1);
    expect(cookies.set).toHaveBeenCalledWith(
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({ id: anotherExperimentId }),
      defaultCookieConfig,
    );
  });

  it('calls getVariant to set a value for a cookie upon construction if needed', () => {
    const id = makeExperimentId('hero');
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue(undefined),
    });
    const variants = [
      { id: 'some-variant-a', percentage: 0.5 },
      { id: 'some-variant-b', percentage: 0.5 },
    ];
    const _getVariant = jest.fn().mockReturnValue(variants[0].id);

    render({
      cookies,
      experimentProps: { id, variants },
      props: { _getVariant },
    });

    expect(_getVariant).toHaveBeenCalledTimes(1);
    expect(_getVariant).toHaveBeenCalledWith({ variants });

    expect(cookies.set).toHaveBeenCalledTimes(1);
    expect(cookies.set).toHaveBeenCalledWith(
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({ id, variantId: variants[0].id }),
      defaultCookieConfig,
    );
  });

  it('does not use a stored variant if it is not for this experiment', () => {
    const otherExperimentVariant = 'variant-for-another-experiment';
    const thisExperimentVariant = 'variant-for-this-experiment';
    const id = makeExperimentId('hero');
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue(undefined),
    });
    const _getVariant = jest.fn().mockReturnValue(thisExperimentVariant);
    const { store } = dispatchClientMetadata();

    // Store a variant for a different experiment.
    store.dispatch(
      storeExperimentVariant({
        id: `different_${id}`,
        variant: otherExperimentVariant,
      }),
    );

    render({
      cookies,
      experimentProps: { id },
      props: { _getVariant },
      store,
    });

    // This expected variant comes from the mocked _getVariant.
    expect(
      screen.getByText(`variant: ${thisExperimentVariant}`),
    ).toBeInTheDocument();
  });

  it('uses the stored variant for this experiment, even when others are present', () => {
    const otherExperimentVariant = 'variant-for-another-experiment';
    const thisExperimentVariant = 'variant-for-this-experiment';
    const id = makeExperimentId('hero');
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue(undefined),
    });
    const { store } = dispatchClientMetadata();

    // Store a variant for this experiment.
    store.dispatch(
      storeExperimentVariant({
        id,
        variant: thisExperimentVariant,
      }),
    );

    // Store a variant for a different experiment.
    store.dispatch(
      storeExperimentVariant({
        id: `different_${id}`,
        variant: otherExperimentVariant,
      }),
    );

    render({
      cookies,
      experimentProps: { id },
      store,
    });

    // This expected variant comes from the store.
    expect(
      screen.getByText(`variant: ${thisExperimentVariant}`),
    ).toBeInTheDocument();
  });

  it('does not call getVariant if the user is to be excluded', () => {
    const _getVariant = jest.fn();
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue(undefined),
    });
    const shouldExcludeUser = jest.fn().mockReturnValue(true);

    render({
      cookies,
      experimentProps: { shouldExcludeUser },
      props: { _getVariant },
    });

    expect(_getVariant).not.toHaveBeenCalled();
    expect(
      screen.getByText(`variant: ${NOT_IN_EXPERIMENT}`),
    ).toBeInTheDocument();
  });

  it('creates a cookie upon render if the current experiment is not already in the cookie', () => {
    const experimentId = makeExperimentId('thisExperiment');
    const anotherExperimentId = makeExperimentId('anotherExperiment');
    const configOverrides = {
      experiments: {
        [experimentId]: true,
        [anotherExperimentId]: true,
      },
    };
    const variantId = 'some-variant-id';
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue({
        ...createExperimentData({ id: anotherExperimentId, variantId }),
      }),
    });
    const _getVariant = jest.fn().mockReturnValue(variantId);

    render({
      configOverrides,
      cookies,
      experimentProps: { id: experimentId },
      props: { _getVariant },
    });

    expect(cookies.set).toHaveBeenCalledWith(
      EXPERIMENT_COOKIE_NAME,
      {
        ...createExperimentData({ id: experimentId, variantId }),
        ...createExperimentData({ id: anotherExperimentId, variantId }),
      },
      defaultCookieConfig,
    );
  });

  it('dispatches storeExperimentVariant to store the variant', () => {
    const id = makeExperimentId('hero');
    const variantId = 'some-variant-id';
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue(undefined),
    });
    const _getVariant = jest.fn().mockReturnValue(variantId);
    const { store } = dispatchClientMetadata();
    const fakeDispatch = jest.spyOn(store, 'dispatch');

    render({
      cookies,
      experimentProps: { id },
      props: { _getVariant },
      store,
    });

    // @@router/LOCATION_CHANGE is always called when a component is rendered.
    expect(fakeDispatch).toHaveBeenCalledTimes(2);
    expect(fakeDispatch).toHaveBeenCalledWith(
      storeExperimentVariant({ id, variant: variantId }),
    );
  });

  it('adds an experiment to the cookie, and removes a disabled one, as expected', () => {
    const experimentId = makeExperimentId('thisExperiment');
    const anotherExperimentId = makeExperimentId('anotherExperiment');
    const configOverrides = {
      experiments: {
        [experimentId]: true,
        [anotherExperimentId]: false,
      },
    };
    const variantId = 'some-variant-id';
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue({
        ...createExperimentData({ id: anotherExperimentId, variantId }),
      }),
    });
    const _getVariant = jest.fn().mockReturnValue(variantId);

    render({
      configOverrides,
      cookies,
      experimentProps: { id: experimentId },
      props: { _getVariant },
    });

    expect(cookies.set).toHaveBeenCalledTimes(1);
    expect(cookies.set).toHaveBeenCalledWith(
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({ id: experimentId, variantId }),
      defaultCookieConfig,
    );
  });

  it('does not update the cookie if the current experiment is already in the cookie', () => {
    const id = makeExperimentId('test-id');
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue(createExperimentData({ id })),
    });

    render({
      cookies,
      experimentProps: { id },
    });

    expect(cookies.set).not.toHaveBeenCalled();
  });

  it('sends an enrollment event if the experiment is not already present in the cookie', () => {
    const experimentId = makeExperimentId('thisExperiment');
    const anotherExperimentId = makeExperimentId('anotherExperiment');
    const variantId = 'some-variant-id';
    const cookies = fakeCookiesWithJest({
      get: sinon
        .stub()
        .returns(createExperimentData({ id: anotherExperimentId })),
    });
    const _getVariant = jest.fn().mockReturnValue(variantId);
    const _tracking = createFakeTrackingWithJest();

    render({
      _tracking,
      cookies,
      experimentProps: { id: experimentId },
      props: { _getVariant },
    });

    expect(_tracking.sendEvent).toHaveBeenCalledTimes(1);
    expect(_tracking.sendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: variantId,
        category: [EXPERIMENT_ENROLLMENT_CATEGORY, experimentId].join(' '),
      }),
    );
  });

  it('does not send an enrollment event if the user is in the experiment', () => {
    const id = makeExperimentId('hero');
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue(createExperimentData({ id })),
    });
    const _tracking = createFakeTrackingWithJest();

    render({
      _tracking,
      cookies,
      experimentProps: { id },
    });

    expect(_tracking.sendEvent).not.toHaveBeenCalled();
  });

  it('does not send an enrollment event if the experiment is disabled', () => {
    const id = makeExperimentId('hero');
    const cookies = fakeCookiesWithJest({
      get: jest.fn().mockReturnValue(undefined),
    });
    const configOverrides = {
      experiments: {
        [id]: false,
      },
    };
    const _tracking = createFakeTrackingWithJest();

    render({
      _tracking,
      configOverrides,
      cookies,
      experimentProps: { id },
    });

    expect(_tracking.sendEvent).not.toHaveBeenCalled();
  });

  it('allows a custom cookie configuration', () => {
    const id = makeExperimentId('custom_cookie_config');
    const variantId = 'some-variant-id';
    const cookies = fakeCookiesWithJest();
    const cookieConfig = { path: '/test' };
    const _getVariant = jest.fn().mockReturnValue(variantId);

    render({
      cookies,
      experimentProps: { id, cookieConfig },
      props: { _getVariant },
    });

    expect(cookies.set).toHaveBeenCalledTimes(1);
    expect(cookies.set).toHaveBeenCalledWith(
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({ id, variantId }),
      cookieConfig,
    );
  });

  it('sets isExperimentEnabled prop to false when experiment is disabled by config', () => {
    const id = makeExperimentId('disabled_experiment');
    const configOverrides = {
      experiments: {
        [id]: false,
      },
    };

    render({ configOverrides, experimentProps: { id } });

    expect(screen.getByText('isExperimentEnabled: false')).toBeInTheDocument();
  });

  it('sets isUserInExperiment prop to false when the user is not in the experiment', () => {
    const id = makeExperimentId('test-id');
    const cookies = fakeCookiesWithJest({
      get: jest
        .fn()
        .mockReturnValue(
          createExperimentData({ id, variantId: NOT_IN_EXPERIMENT }),
        ),
    });

    render({ cookies, experimentProps: { id } });

    expect(screen.getByText('isUserInExperiment: false')).toBeInTheDocument();
  });

  it('sets isUserInExperiment prop to false when the experiment is disabled', () => {
    const id = makeExperimentId('disabled_experiment');
    const configOverrides = {
      experiments: {
        [id]: false,
      },
    };

    render({ configOverrides, experimentProps: { id } });

    expect(screen.getByText('isUserInExperiment: false')).toBeInTheDocument();
  });

  it('disables the experiment by default', () => {
    const configOverrides = {
      // No experiment defined.
      experiments: {},
    };

    render({ configOverrides });

    expect(screen.getByText('isExperimentEnabled: false')).toBeInTheDocument();
  });

  it('can handle a null for experiments in the config', () => {
    const configOverrides = { experiments: null };

    render({ configOverrides });

    expect(screen.getByText('isExperimentEnabled: false')).toBeInTheDocument();
  });

  it('throws an exception for a badly formatted experimentId', () => {
    expect(() => {
      render({ experimentProps: { id: 'bad-id' } });
    }).toThrow(/id must match the pattern YYYYMMDD_amo_experiment_id/);
  });

  it('throws an exception for an experimentId that is too long', () => {
    expect(() => {
      render({ experimentProps: { id: `20210708_amo_${'a'.repeat(50)}` } });
    }).toThrow(/id must be no more than 50 characters long/);
  });

  it('does not have any invalid experiment ids defined in the config', () => {
    // If this test fails it is because an experimentId does not match the
    // expected format of YYYYMMDD_amo_ExperimentName or is greater than 50
    // characters long.
    // eslint-disable-next-line import/namespace
    for (const experimentId of Object.keys(defaultConfig.experiments)) {
      expect(EXPERIMENT_ID_REGEXP.test(experimentId)).toEqual(true);
      expect(experimentId.length).toBeLessThan(50);
    }
  });

  describe('getVariant', () => {
    const variants = [
      { id: 'some-variant-a', percentage: 0.1 },
      { id: 'some-variant-b', percentage: 0.2 },
      { id: NOT_IN_EXPERIMENT, percentage: 0.7 },
    ];

    it.each([
      [variants[0], 0.01],
      [variants[0], 0.1],
      [variants[1], 0.11],
      [variants[1], 0.3],
      [variants[2], 0.31],
      [variants[2], 0.99],
    ])(
      'assigns variant %s based on a percent of %s',
      (expectedVariant, randomNumber) => {
        const randomizer = jest.fn().mockReturnValue(randomNumber);

        expect(getVariant({ randomizer, variants })).toEqual(
          expectedVariant.id,
        );
        expect(randomizer).toHaveBeenCalled();
      },
    );

    it('throws an exception if the percentages of variants is less than 100%', () => {
      const randomizer = jest.fn().mockReturnValue(1);
      const badVariants = [
        { id: 'some-variant-a', percentage: 1 / 3 },
        { id: 'some-variant-b', percentage: 1 / 3 },
      ];

      expect(() => {
        getVariant({ randomizer, variants: badVariants });
      }).toThrow(/The sum of all percentages/);
    });

    it('throws an exception if the percentages of variants is greater than 100%', () => {
      const randomizer = jest.fn().mockReturnValue(1);
      const badVariants = [
        { id: 'some-variant-a', percentage: 2 / 3 },
        { id: 'some-variant-b', percentage: 2 / 3 },
      ];

      expect(() => {
        getVariant({ randomizer, variants: badVariants });
      }).toThrow(/The sum of all percentages/);
    });

    it('throws an exception if a variant id is greater than 50 characters long', () => {
      const badVariants = [
        { id: 'a'.repeat(51), percentage: 0.5 },
        { id: 'some-variant-b', percentage: 0.5 },
      ];

      expect(() => {
        getVariant({ variants: badVariants });
      }).toThrow(/Variant ids must be no more than 50 characters long/);
    });
  });
});
