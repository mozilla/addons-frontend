import React from 'react';
import { compose } from 'redux';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';

import NotFound from 'core/components/ErrorPage/NotFound';
import I18nProvider from 'core/i18n/Provider';
import { render404WhenNotAllowed } from
  'core/containers/error-simulation/utils';
import { getFakeI18nInst } from 'tests/client/helpers';

describe('render404WhenNotAllowed', () => {
  function render(customProps = {}, { SomeComponent = () => <div /> } = {}) {
    const props = {
      config: { get: () => true },
      ...customProps,
    };

    const WrappedComponent = compose(
      render404WhenNotAllowed,
    )(SomeComponent);

    return renderIntoDocument(
      <I18nProvider i18n={getFakeI18nInst()}>
        <WrappedComponent {...props} />
      </I18nProvider>
    );
  }

  it('returns a 404 when disabled by the config', () => {
    const config = {
      get: sinon.spy(() => false),
    };
    const root = render({ config });
    const node = findRenderedComponentWithType(root, NotFound);

    assert.ok(node, '<NotFound /> was not rendered');
    assert.ok(config.get.called, 'config.get() was not called');
    assert.ok(config.get.firstCall.args[0], 'allowErrorSimulation');
  });

  it('passes through component props', () => {
    const SomeComponent = sinon.spy(() => <div />);
    render({ color: 'orange', size: 'large' }, { SomeComponent });

    assert.ok(SomeComponent.called, '<SomeComponent /> was not rendered');
    const props = SomeComponent.firstCall.args[0];
    assert.equal(props.color, 'orange');
    assert.equal(props.size, 'large');
  });
});
