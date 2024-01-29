/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import translate from 'amo/i18n/translate';

class Component extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
  };

  renderFoo() {
    return null;
  }

  render() {
    const { name } = this.props;
    return <div>{name} {this.renderFoo()}</div>;
  }
}

export default Component;
