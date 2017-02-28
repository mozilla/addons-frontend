/* eslint-disable react/require-render-return */
import { compose } from 'redux';
import React from 'react';

import log from 'core/logger';

import { render404WhenNotAllowed } from './utils';

export class SimulateSyncErrorBase extends React.Component {
  render() {
    log.info('Simulating a synchronous error');
    throw new Error('This is a simulated synchronous error');
  }
}

export default compose(
  render404WhenNotAllowed,
)(SimulateSyncErrorBase);
