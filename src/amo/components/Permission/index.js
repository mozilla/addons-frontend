/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import Icon from 'amo/components/Icon';

type PermissionProps = {|
  description: string,
  type: string,
|};

export default class Permission extends React.Component<PermissionProps> {
  render(): React.Element<"li"> {
    const { type, description } = this.props;
    return (
      <li className={makeClassName('Permission')}>
        <Icon name={`permission-${type.replace(/\./g, '-')}`} />
        <span className="Permission-description">{description}</span>
      </li>
    );
  }
}
