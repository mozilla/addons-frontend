import classNames from 'classnames';
import React, { PropTypes } from 'react';

import Button from 'ui/components/Button';

import './styles.scss';


export default class ErrorList extends React.Component {
  static propTypes = {
    errors: PropTypes.array.isRequired,
    className: PropTypes.string,
  }

  render() {
    const { errors } = this.props;
    let needsPageRefresh = false;
    const items = [];

    errors.forEach((error) => {
      error.messages.forEach((msg) => {
        let msgString = msg;
        if (typeof msgString === 'object') {
          // This is an unlikely scenario where an API response
          // contains nested objects within objects. If this
          // happens in real life let's make it prettier.
          // Until then, let's just prevent a stack trace.
          msgString = JSON.stringify(msgString);
        }
        items.push(msgString);
      });

      if (error.needsPageRefresh) {
        needsPageRefresh = true;
      }
    });

    if (needsPageRefresh) {
      // TODO: L10n
      items.push(<Button>{'Reload To Continue'}</Button>);
    }

    return (
      <ul className="ErrorList">
        {items.map((item) => <li className="ErrorList-item">{item}</li>)}
      </ul>
    );
  }
}
