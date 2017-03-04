import { compose } from 'redux';
import React from 'react';

import { render404IfConfigKeyIsFalse } from 'core/utils';
import Button from 'ui/components/Button';

import './SimulateClientError.scss';

export class SimulateClientErrorBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = { buttonClicked: false };
  }

  onClick = () => {
    this.setState({ buttonClicked: true });
    setTimeout(() => this.setState({ buttonClicked: false }), 3000);
    throw new Error('This is a simulated client error');
  }

  render() {
    const prompt = this.state.buttonClicked ?
      'Nice! Check Sentry' : 'Trigger an error 💣';
    return (
      <div className="SimulateClientError">
        <Button onClick={this.onClick}>{prompt}</Button>
      </div>
    );
  }
}

export default compose(
  render404IfConfigKeyIsFalse('allowErrorSimulation'),
)(SimulateClientErrorBase);
