/* global window */
import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import { API_ERRORS_SESSION_EXPIRY } from 'amo/constants';
import log from 'amo/logger';
import translate from 'amo/i18n/translate';
import Notice from 'amo/components/Notice';

import './styles.scss';

export class ErrorListBase extends React.Component {
  static propTypes = {
    _window: PropTypes.object,
    code: PropTypes.string,
    className: PropTypes.string,
    i18n: PropTypes.object.isRequired,
    messages: PropTypes.array.isRequired,
  };

  static defaultProps = {
    _window: typeof window !== 'undefined' ? window : {},
  };

  render() {
    const { _window, code, className, i18n, messages } = this.props;
    const items = [];

    messages.forEach((messageItem) => {
      let message = messageItem;
      if (typeof message === 'object') {
        // This handles an unlikely scenario where an API error response
        // contains nested objects within objects. If this happens in real
        // life let's fix it or make the display prettier.
        // Until then, let's just prevent it from triggering an exception.
        message = JSON.stringify(message);
      }
      if (API_ERRORS_SESSION_EXPIRY.includes(code)) {
        // This API error describes exactly what happened but that isn't
        // very helpful for AMO users. Let's help them figure it out.
        log.debug(`Detected ${code}, replacing API message: ${message}`);
        message = i18n.t('Your session has expired');
      }
      items.push(message);
    });

    if (!items.length) {
      log.debug(`No messages were passed to ErrorList, code: ${code}`);
      items.push(i18n.t('An unexpected error occurred'));
    }

    let action;
    let actionText;
    if (API_ERRORS_SESSION_EXPIRY.includes(code)) {
      // Let the user recover from signature expired errors.
      action = () => _window.location.reload();
      actionText = i18n.t('Reload To Continue');
      if (items.length > 1) {
        // There will never be more than one message but if there is, log a message
        // to help someone debug the problem.
        log.warn(
          'The API unexpectedly returned multiple signature expired errors',
        );
      }
    }

    return (
      <ul className={makeClassName('ErrorList', className)}>
        {items.map((item, index) => {
          return (
            <li
              className="ErrorList-item"
              // We don't have message IDs but it's safe to rely on
              // array indices since they are returned from the API
              // in a predictable order.
              // eslint-disable-next-line react/no-array-index-key
              key={`erroritem-${index}`}
            >
              <Notice
                type="error"
                actionOnClick={action}
                actionText={actionText}
              >
                {item}
              </Notice>
            </li>
          );
        })}
      </ul>
    );
  }
}

export default compose(translate())(ErrorListBase);
