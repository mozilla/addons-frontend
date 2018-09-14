import { shallow } from 'enzyme';
import * as React from 'react';

import { withExperiment } from 'core/withExperiment';
import { fakeCookie } from 'tests/unit/helpers';

describe(__filename, () => {
  class SomeComponentBase extends React.Component {
    render() {
      return <div className="component" />;
    }
  }

  function setComponentWithExperiment({ experimentProps } = {}) {
    return withExperiment({
      id: 'ABtest',
      variantA: 'AName',
      variantB: 'BName',
      ...experimentProps,
    })(SomeComponentBase);
  }

  function render({ experimentProps, props } = {}) {
    const SomeComponent = setComponentWithExperiment({ experimentProps });

    return shallow(<SomeComponent {...props} />);
  }

  it('injects a variant prop', () => {
    const root = render();
    expect(root).toHaveProp('variant');
  });

  it('loads a cookie upon construction', () => {
    const _cookie = fakeCookie();

    render({
      props: {
        _cookie,
      },
    });

    sinon.assert.called(_cookie.load);
  });

  it('creates a cookie upon construction if none has been loaded', () => {
    const id = 'hero';
    const _cookie = fakeCookie({
      load: sinon.stub().returns(undefined),
    });

    const root = render({
      props: {
        _cookie,
        id,
      },
    });

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

    render({
      props: {
        _cookie,
        id,
      },
    });

    sinon.assert.notCalled(_cookie.save);
  });

  it('it allows a custom cookie configuration', () => {
    const overrideCookieConfig = { path: '/test' };
    const _cookie = fakeCookie();
    const id = 'custom_cookie_config';

    const root = render({
      props: {
        _cookie,
        id,
      },
      experimentProps: { cookieConfig: overrideCookieConfig },
    });

    sinon.assert.calledWith(
      _cookie.save,
      `experiment_${id}`,
      root.instance().experimentCookie,
      overrideCookieConfig,
    );
  });

  it('sets a display name', () => {
    const SomeComponent = setComponentWithExperiment();
    expect(SomeComponent.displayName).toMatch(
      /WithExperiment\(SomeComponentBase\)/,
    );
  });
});
