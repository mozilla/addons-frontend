/* @flow */
import * as React from 'react';

type PermissionProps = {|
  description: string,
|};

export default class Permission extends React.Component<PermissionProps> {
  render(): React.Node {
    const { description } = this.props;
    return (
      <li className="Permission">
        <span className="Permission-description">{description}</span>
      </li>
    );
  }
}
