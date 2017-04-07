import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';

import './styles.scss';


class ErrorList extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    i18n: PropTypes.object.isRequired,
    messages: PropTypes.array.isRequired,
    needsPageRefresh: PropTypes.boolean,
  }

  static defaultProps = {
    needsPageRefresh: false,
  };

  render() {
    const { i18n, messages, needsPageRefresh } = this.props;
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
      items.push(msgString);
    });

    if (needsPageRefresh) {
      items.push(
        <Button>{i18n.gettext('Reload To Continue')}</Button>
      );
    }

    return (
      <ul className="ErrorList">
        {items.map((item) => <li className="ErrorList-item">{item}</li>)}
      </ul>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(ErrorList);
