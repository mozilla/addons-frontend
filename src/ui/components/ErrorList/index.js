/* global window */
import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';

import { API_ERROR_SIGNATURE_EXPIRED } from 'core/constants';
import log from 'core/logger';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';

import './styles.scss';


class ErrorList extends React.Component {
  static propTypes = {
    _window: PropTypes.object,
    code: PropTypes.string,
    className: PropTypes.string,
    i18n: PropTypes.object.isRequired,
    messages: PropTypes.array.isRequired,
  }

  static defaultProps = {
    _window: typeof window !== 'undefined' ? window : {},
  };

  render() {
    const { _window, code, className, i18n, messages } = this.props;
    const items = [];

    messages.forEach((msg) => {
      let msgString = msg;
      if (typeof msgString === 'object') {
        // This handles an unlikely scenario where an API error response
        // contains nested objects within objects. If this happens in real
        // life let's fix it or make the display prettier.
        // Until then, let's just prevent it from triggering an exception.
        msgString = JSON.stringify(msgString);
      }
      if (code === API_ERROR_SIGNATURE_EXPIRED) {
        // This API error describes exactly what happened but that isn't
        // very helpful for AMO users. Let's help them figure it out.
        log.debug(`Detected ${code}, replacing API translation: ${msgString}`);
        msgString = i18n.gettext('Your session has expired');
      }
      items.push(msgString);
    });

    if (code === API_ERROR_SIGNATURE_EXPIRED) {
      items.push(
        <Button onClick={() => _window.location.reload()}>
          {i18n.gettext('Reload To Continue')}
        </Button>
      );
    }

    return (
      <ul className={classNames('ErrorList', className)}>
        {items.map((item) => <li className="ErrorList-item">{item}</li>)}
      </ul>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(ErrorList);
