/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import Icon from 'ui/components/Icon';


type PermissionProps = {|
  className: string,
  description: string,
|};

export default class Permission extends React.Component<PermissionProps> {
  render() {
    const { className, description } = this.props;
    return (
      <li className={makeClassName('Permission', className)}>
        <Icon name={`permission-${className.replace(/\./g, '-')}`} />
        <span className="Permission-description">
          {description}
        </span>
      </li>
    );
  }
}
