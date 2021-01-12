import { shallow } from 'enzyme';
import * as React from 'react';

import {
  EXPERIMENT_ENROLLMENT_CATEGORY,
  NOT_IN_EXPERIMENT,
  defaultCookieConfig,
  getVariant,
  withExperiment,
} from 'amo/withExperiment';
import {
  createFakeTracking,
  fakeCookies,
  getFakeConfig,
} from 'tests/unit/helpers';

describe(__filename, () => {
  class SomeComponentBase extends React.Component {
    render() {
      return <div className="component" />;
    }
  }

  const renderWithExperiment = ({
    props,
    experimentProps,
    context = fakeCookies(),
  } = {}) => {
    const allExperimentProps = {
      id: 'some-id',
      ...experimentProps,
    };

    // Enable the experiment by default to ease testing.
    const _config = getFakeConfig({
      experiments: {
        [allExperimentProps.id]: true,
      },
    });

    const allProps = {
      _config,
      ...props,
    };

    const SomeComponent = withExperiment({
      id: 'some-id',
      variants: [
        { id: 'some-variant-a', percentage: 0.5 },
        { id: 'some-variant-b', percentage: 0.5 },
      ],
      ...experimentProps,
    })(SomeComponentBase);

    // Temporary workaround for supporting the React (stable) Context API.
    // See: https://github.com/mozilla/addons-frontend/issues/6839
    //
    // 1. Render everything
    const root = shallow(<SomeComponent {...allProps} />);
    // 2. Get and render the withExperiment HOC (inside withCookies() HOC)
    return shallow(root.props().children(context));
  };

  const render = (props = {}) => {
    const root = renderWithExperiment(props);
    // Return the wrapped instance (`SomeComponentBase`)
    return root.dive();
  };

  it('injects a variant prop', () => {
    const root = render();
    expect(root).toHaveProp('variant');
  });

  it('injects an isExperimentEnabled prop', () => {
    const root = render();
    expect(root).toHaveProp('isExperimentEnabled', true);
  });

  it('injects an isUserInExperiment prop', () => {
    const root = render();
    expect(root).toHaveProp('isUserInExperiment', true);
  });

  it('gets a cookie upon construction', () => {
    const cookies = fakeCookies();

    // `react-cookie` uses the React (stable) Context API.
    render({ context: cookies });

    sinon.assert.called(cookies.get);
  });

  it('creates a cookie upon construction if none has been loaded', () => {
    const id = 'hero';
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });

    // `react-cookie` uses the React (stable) Context API.
    const root = render({ context: cookies, experimentProps: { id } });

    sinon.assert.calledWith(
      cookies.set,
      `${id}Experiment`,
      root.instance().experimentCookie,
      defaultCookieConfig,
    );
  });

  it('calls getVariant to set a value for a cookie upon construction if none has been loaded', () => {
    const id = 'hero';
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });
    const variants = [
      { id: 'some-variant-a', percentage: 0.5 },
      { id: 'some-variant-b', percentage: 0.5 },
    ];
    const _getVariant = sinon.stub().returns(variants[0]);

    // `react-cookie` uses the React (stable) Context API.
    render({
      context: cookies,
      experimentProps: { id, variants },
      props: { _getVariant },
    });

    sinon.assert.calledWith(_getVariant, { variants });

    sinon.assert.calledWith(
      cookies.set,
      `${id}Experiment`,
      variants[0].id,
      defaultCookieConfig,
    );
  });

  it('sends an enrollment event upon construction if no cookie has been loaded', () => {
    const id = 'hero';
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });
    const _tracking = createFakeTracking();

    // `react-cookie` uses the React (stable) Context API.
    const root = render({
      context: cookies,
      experimentProps: { _tracking, id },
    });

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: root.instance().experimentCookie,
      category: [EXPERIMENT_ENROLLMENT_CATEGORY, id].join(' '),
    });
  });

  it('does not send an enrollment event upon construction if the user is not in the experiment', () => {
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });
    const _tracking = createFakeTracking();
    const variants = [{ id: NOT_IN_EXPERIMENT, percentage: 1 }];

    // `react-cookie` uses the React (stable) Context API.
    render({
      context: cookies,
      experimentProps: { _tracking, variants },
    });

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('does not create a cookie upon construction if one has been loaded', () => {
    const id = 'hero';
    const cookies = fakeCookies({
      get: sinon.stub().returns(`${id}Experiment`),
    });

    // `react-cookie` uses the React (stable) Context API.
    render({ context: cookies, experimentProps: { id } });

    sinon.assert.notCalled(cookies.set);
  });

  it('does not send an enrollment event upon construction if a cookie has been loaded', () => {
    const id = 'hero';
    const cookies = fakeCookies({
      get: sinon.stub().returns(`${id}Experiment`),
    });
    const _tracking = createFakeTracking();

    // `react-cookie` uses the React (stable) Context API.
    render({
      context: cookies,
      experimentProps: { _tracking, id },
    });

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('does not send an enrollment event upon construction if the experiment is disabled', () => {
    const id = 'hero';
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });
    const _config = getFakeConfig({
      experiments: {
        [id]: false,
      },
    });
    const _tracking = createFakeTracking();

    // `react-cookie` uses the React (stable) Context API.
    render({
      context: cookies,
      props: { _config },
      experimentProps: { _tracking, id },
    });

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('allows a custom cookie configuration', () => {
    const id = 'custom_cookie_config';
    const cookies = fakeCookies();
    const cookieConfig = { path: '/test' };

    const root = render({
      // `react-cookie` uses the React (stable) Context API.
      context: cookies,
      experimentProps: { id, cookieConfig },
    });

    sinon.assert.calledWith(
      cookies.set,
      `${id}Experiment`,
      root.instance().experimentCookie,
      cookieConfig,
    );
  });

  it('sets a display name', () => {
    const SomeComponent = renderWithExperiment();

    expect(SomeComponent.name()).toMatch(/WithExperiment\(SomeComponentBase\)/);
  });

  it('can be disabled by configuration', () => {
    const id = 'disabled_experiment';
    const cookies = fakeCookies();
    const _config = getFakeConfig({
      experiments: {
        [id]: false,
      },
    });

    // `react-cookie` uses the React (stable) Context API.
    render({ context: cookies, props: { _config }, experimentProps: { id } });

    sinon.assert.notCalled(cookies.get);
  });

  it('sets isExperimentEnabled prop to false when experiment is disabled by config', () => {
    const id = 'disabled_experiment';
    const _config = getFakeConfig({
      experiments: {
        [id]: false,
      },
    });

    const root = render({ props: { _config }, experimentProps: { id } });
    expect(root).toHaveProp('isExperimentEnabled', false);
  });

  it('sets isUserInExperiment prop to false when the user is not in the experiment', () => {
    const cookies = fakeCookies({
      get: sinon.stub().returns(NOT_IN_EXPERIMENT),
    });

    const root = render({ context: cookies });
    expect(root).toHaveProp('isUserInExperiment', false);
  });

  it('sets isUserInExperiment prop to false when the experiment is disabled', () => {
    const id = 'disabled_experiment';
    const _config = getFakeConfig({
      experiments: {
        [id]: false,
      },
    });

    const root = render({ props: { _config }, experimentProps: { id } });
    expect(root).toHaveProp('isUserInExperiment', false);
  });

  it('disables the experiment by default', () => {
    const _config = getFakeConfig({
      // No experiment defined.
      experiments: {},
    });

    const root = render({ props: { _config } });
    expect(root).toHaveProp('isExperimentEnabled', false);
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
        const randomizer = sinon.stub().returns(randomNumber);

        expect(getVariant({ randomizer, variants })).toEqual(expectedVariant);
        sinon.assert.called(randomizer);
      },
    );

    it('throws an exception if the percentages of variants is less than 100%', () => {
      const randomizer = sinon.stub().returns(1);
      const badVariants = [
        { id: 'some-variant-a', percentage: 1 / 3 },
        { id: 'some-variant-b', percentage: 1 / 3 },
      ];

      expect(() => {
        getVariant({ randomizer, variants: badVariants });
      }).toThrow(/The sum of all percentages/);
    });

    it('throws an exception if the percentages of variants is greater than 100%', () => {
      const randomizer = sinon.stub().returns(1);
      const badVariants = [
        { id: 'some-variant-a', percentage: 2 / 3 },
        { id: 'some-variant-b', percentage: 2 / 3 },
      ];

      expect(() => {
        getVariant({ randomizer, variants: badVariants });
      }).toThrow(/The sum of all percentages/);
    });
  });
});
