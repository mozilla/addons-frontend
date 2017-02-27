import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';

import SimulateError from 'core/containers/SimulateError';

describe('SimulateError', () => {
  let clock;
  before(() => {
    // This is only precautionary in case stubbing out setTimeout fails.
    clock = sinon.useFakeTimers();
  });

  after(() => {
    clock.restore();
  });

  function render(customProps = {}) {
    const props = { _setTimeout: sinon.stub(), ...customProps };
    return renderIntoDocument(<SimulateError {...props} />);
  }

  it('throws a simulated error', () => {
    assert.throws(() => render(), /simulated error in Component.render/);
  });

  it('throws an async error', () => {
    const fakeSetTimeout = sinon.stub();
    assert.throws(() => render({ _setTimeout: fakeSetTimeout }));

    assert.ok(fakeSetTimeout.called, 'setTimeout was not called');
    const callback = fakeSetTimeout.firstCall.args[0];
    assert.throws(() => callback(), /simulated error in the event loop/);
  });
});
