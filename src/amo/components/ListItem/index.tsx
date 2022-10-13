import makeClassName from 'classnames';
import * as React from 'react';

type Props = {
  children?: React.ChildrenArray<React.ReactNode | string>;
  className?: string;
}; // An <li> helper for <ul> arrays.
//
// Every component in an array needs to have a key so this allows
// you to fill an array with <li> components that have a common
// class name. You still have to manually define a key prop.

export default class ListItem extends React.Component<Props> {
  render(): React.ReactNode {
    const {
      children,
      className,
    } = this.props;
    return <li className={makeClassName('ListItem', className)}>{children}</li>;
  }

}