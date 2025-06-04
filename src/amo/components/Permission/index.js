/* @flow */
import * as React from 'react';

import Icon from 'amo/components/Icon';

type PermissionProps = {|
  description: string,
  type: string,
|};

export default class Permission extends React.Component<PermissionProps> {
  render(): React.Node {
    const { type, description } = this.props;
    return (
      <li className="Permission">
        <span className="Permission-description">{description}</span>
      </li>
    );
  }
}
