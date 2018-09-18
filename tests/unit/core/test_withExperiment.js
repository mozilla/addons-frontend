import { shallow } from 'enzyme';
import * as React from 'react';

import { withExperiment } from 'core/withExperiment';
import { fakeCookie, getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  class SomeComponentBase extends React.Component {
    render() {
      return <div className="component" />;
    }
  }

  function getComponentWithExperiment(experimentProps = {}) {
    return withExperiment({
      id: 'some-id',
      variantA: 'some-variant-a',
      variantB: 'some-variant-b',
      ...experimentProps,
    })(SomeComponentBase);
  }

  function render({ props, experimentProps } = {}) {
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

    const SomeComponent = getComponentWithExperiment(allExperimentProps);

    return shallow(<SomeComponent {...allProps} />);
  }

  it('injects a variant prop', () => {
    const root = render();
    expect(root).toHaveProp('variant');
  });

  it('injects an experimentEnabled prop', () => {
    const root = render();
    expect(root).toHaveProp('experimentEnabled', true);
  });

  it('loads a cookie upon construction', () => {
    const _cookie = fakeCookie();

    render({ props: { _cookie } });

    sinon.assert.called(_cookie.load);
  });

  it('creates a cookie upon construction if none has been loaded', () => {
    const id = 'hero';
    const _cookie = fakeCookie({
      load: sinon.stub().returns(undefined),
    });

    const root = render({ props: { _cookie }, experimentProps: { id } });

    sinon.assert.calledWith(
      _cookie.save,
      `experiment_${id}`,
      root.instance().experimentCookie,
    );
  });

  it('does not create a cookie upon construction if one has been loaded', () => {
    const id = 'hero';
    const _cookie = fakeCookie({
      load: sinon.stub().returns(`experiment_${id}`),
    });

    render({ props: { _cookie }, experimentProps: { id } });

    sinon.assert.notCalled(_cookie.save);
  });

  it('allows a custom cookie configuration', () => {
    const id = 'custom_cookie_config';
    const _cookie = fakeCookie();
    const cookieConfig = { path: '/test' };

    const root = render({
      props: { _cookie },
      experimentProps: { id, cookieConfig },
    });

    sinon.assert.calledWith(
      _cookie.save,
      `experiment_${id}`,
      root.instance().experimentCookie,
      cookieConfig,
    );
  });

  it('sets a display name', () => {
    const SomeComponent = getComponentWithExperiment();
    expect(SomeComponent.displayName).toMatch(
      /WithExperiment\(SomeComponentBase\)/,
    );
  });

  it('can be disabled by configuration', () => {
    const id = 'disabled_experiment';
    const _cookie = fakeCookie();
    const _config = getFakeConfig({
      experiments: {
        [id]: false,
      },
    });

    render({ props: { _config }, experimentProps: { id } });

    sinon.assert.notCalled(_cookie.load);
  });

  it('sets experimentEnabled prop to false when experiment is disabled by config', () => {
    const id = 'disabled_experiment';
    const _config = getFakeConfig({
      experiments: {
        [id]: false,
      },
    });

    const root = render({ props: { _config }, experimentProps: { id } });
    expect(root).toHaveProp('experimentEnabled', false);
  });

  it('disables the experiment by default', () => {
    const _config = getFakeConfig({
      // No experiment defined.
      experiments: {},
    });

    const root = render({ props: { _config } });
    expect(root).toHaveProp('experimentEnabled', false);
  });
});
