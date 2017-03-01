import { compose } from 'redux';
import React from 'react';

import log from 'core/logger';
import { render404IfConfigKeyIsFalse } from 'core/utils';

export class SimulateAsyncErrorBase extends React.Component {
  render() {
    log.info('Simulating an asynchronous error');
    setTimeout(() => {
      throw new Error('This is a simulated asynchronous error');
    }, 50);
    return <p>Asynchronous error simulated, check the logs</p>;
  }
}

export default compose(
  render404IfConfigKeyIsFalse('allowErrorSimulation'),
)(SimulateAsyncErrorBase);
