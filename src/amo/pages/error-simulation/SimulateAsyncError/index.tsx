import { compose } from 'redux';
import * as React from 'react';

import log from 'amo/logger';
import { render404IfConfigKeyIsFalse } from 'amo/utils/errors';

export class SimulateAsyncErrorBase extends React.Component {
  render() {
    log.info('Simulating an asynchronous error');
    setTimeout(() => {
      throw new Error('This is a simulated asynchronous error');
    }, 50);
    return <p>Asynchronous error simulated, check the logs</p>;
  }

}
export default compose(render404IfConfigKeyIsFalse('allowErrorSimulation'))(SimulateAsyncErrorBase);