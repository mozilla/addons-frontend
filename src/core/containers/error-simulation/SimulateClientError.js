import { compose } from 'redux';
import * as React from 'react';

import { render404IfConfigKeyIsFalse } from 'core/utils';
import Button from 'ui/components/Button';

import './SimulateClientError.scss';

export class SimulateClientErrorBase extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      buttonClicked: false,
      throwRenderError: false,
    };
  }

  onClick = () => {
    this.setState({ buttonClicked: true });
    setTimeout(() => this.setState({ buttonClicked: false }), 3000);

    throw new Error('This is a simulated client error');
  }

  throwRenderError = () => {
    this.setState({ throwRenderError: true });
  }

  render() {
    const prompt = this.state.buttonClicked ?
      'Nice! Check Sentry' : '💣 Go ahead, trigger an error';

    if (this.state.throwRenderError) {
      throw new Error('This is a simulated client render error');
    }

    return (
      <div className="SimulateClientError">
        <Button buttonType="neutral" onClick={this.onClick}>
          {prompt}
        </Button>

        <Button buttonType="alert" onClick={this.throwRenderError}>
          Trigger a render error
        </Button>
      </div>
    );
  }
}

export default compose(
  render404IfConfigKeyIsFalse('allowErrorSimulation'),
)(SimulateClientErrorBase);
