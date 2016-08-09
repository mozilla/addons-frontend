import React, { PropTypes } from 'react';
import classNames from 'classnames';

import './style.scss';

export default class JsonData extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired,
  }

  constructor() {
    super();
    this.state = { isVisible: false };
  }

  toggle = () => {
    const { isVisible } = this.state;
    this.setState({ isVisible: !isVisible });
  }

  render() {
    const { isVisible } = this.state;
    const buttonText = isVisible ? 'Hide JSON' : 'Show JSON';
    return (
      <div className={classNames('JsonData', { 'JsonData-visible': isVisible })}>
        <button className="JsonData-toggle" onClick={this.toggle}>{buttonText}</button>
        <pre className="JsonData-json">{JSON.stringify(this.props.data, null, 2)}</pre>
      </div>
    );
  }
}
