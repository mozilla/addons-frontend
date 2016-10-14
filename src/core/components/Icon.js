import React, { PropTypes } from 'react';

import './Icon.scss';


export default class Icon extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
  }

  render() {
    const { name } = this.props;

    return (
      <svg className={`${name}Icon`}>
        <use xlinkHref={`#${name}Icon`} />
      </svg>
    );
  }
}
