import * as React from 'react';

import Icon from 'amo/components/Icon';

type PermissionProps = {
  description: string;
  type: string;
};
export default class Permission extends React.Component<PermissionProps> {
  render(): React.ReactNode {
    const {
      type,
      description,
    } = this.props;
    return <li className="Permission">
        <Icon name={`permission-${type.replace(/\./g, '-')}`} />
        <span className="Permission-description">{description}</span>
      </li>;
  }

}