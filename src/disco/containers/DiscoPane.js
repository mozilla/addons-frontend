import React from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';

import { gettext as _ } from 'core/utils';


class DiscoPane extends React.Component {
  render() {
    return (
      <div id="app-view" ref="container">
        <h1>{_('HELLO DISCO WORLD')}</h1>
      </div>
    );
  }
}

function loadDataIfNeeded() {
  /* istanbul ignore next */
  return Promise.resolve();
}

export default asyncConnect([{
  deferred: true,
  promise: loadDataIfNeeded,
}])(connect()(DiscoPane));
