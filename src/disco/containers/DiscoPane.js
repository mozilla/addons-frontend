import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { camelCaseProps } from 'core/utils';

import Addon from 'disco/components/Addon';
import fakeData from 'disco/fakeData';


class DiscoPane extends React.Component {
  static propTypes = {
    results: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    results: fakeData.results,
  }

  render() {
    const { results } = this.props;
    return (
      <div id="app-view" ref="container">
        {results.map((item, i) => <Addon {...camelCaseProps(item)} key={i} />)}
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
