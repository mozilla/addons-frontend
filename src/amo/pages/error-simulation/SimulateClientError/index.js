import { compose } from 'redux';
import * as React from 'react';

import { render404IfConfigKeyIsFalse } from 'amo/utils/errors';
import Button from 'ui/components/Button';

import './styles.scss';

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
  };

  throwRenderError = () => {
    this.setState({ throwRenderError: true });
  };

  render() {
    const prompt = this.state.buttonClicked
      ? 'Nice! Check Sentry'
      : '💣 Go ahead, trigger an error';

    if (this.state.throwRenderError) {
      throw new Error('This is a simulated client render error');
    }

    return (
      <div className="SimulateClientError">
        <div>
          <p>
            This page allows you to simulate client errors, mainly to test our
            integration with Sentry. If Sentry is enabled (by configuring a
            DSN), the errors produced by clicking the buttons should appear in
            the interface.
          </p>
          <p>There are two available behaviors:</p>

          <ul>
            <li>
              The grey button allows to throw an error in the button handler (
              <code>onClick()</code>) and can be used multiple times. It throws
              unhandled errors, which should be automatically logged by Sentry.
            </li>
            <li>
              The red button allows to throw an error in the{' '}
              <code>render()</code> method and is not recoverable because the
              error will be handled in the <code>ErrorPage</code> component,
              which should log the error with <code>log.error()</code>. On the
              client, <code>log.error</code> is bound to{' '}
              <code>console.error</code>, which should automatically send errors
              to Sentry.
            </li>
          </ul>
        </div>

        <div>
          <Button
            buttonType="neutral"
            className="SimulateClientError-error"
            onClick={this.onClick}
          >
            {prompt}
          </Button>

          <Button
            buttonType="alert"
            className="SimulateClientError-render-error"
            onClick={this.throwRenderError}
          >
            Trigger a render error
          </Button>
        </div>
      </div>
    );
  }
}

export default compose(render404IfConfigKeyIsFalse('allowErrorSimulation'))(
  SimulateClientErrorBase,
);
