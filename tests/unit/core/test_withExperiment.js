import { shallow } from 'enzyme';
import * as React from 'react';

import {
  EXPERIMENT_ENROLLMENT_CATEGORY,
  withExperiment,
} from 'core/withExperiment';
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
      variantA: 'some-variant-a',
      variantB: 'some-variant-b',
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

  it('injects an experimentIsEnabled prop', () => {
    const root = render();
    expect(root).toHaveProp('experimentIsEnabled', true);
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

  it('sets experimentIsEnabled prop to false when experiment is disabled by config', () => {
    const id = 'disabled_experiment';
    const _config = getFakeConfig({
      experiments: {
        [id]: false,
      },
    });

    const root = render({ props: { _config }, experimentProps: { id } });
    expect(root).toHaveProp('experimentIsEnabled', false);
  });

  it('disables the experiment by default', () => {
    const _config = getFakeConfig({
      // No experiment defined.
      experiments: {},
    });

    const root = render({ props: { _config } });
    expect(root).toHaveProp('experimentIsEnabled', false);
  });
});
