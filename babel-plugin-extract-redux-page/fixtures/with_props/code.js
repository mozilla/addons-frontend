/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import translate from 'amo/i18n/translate';

type Props = {|
  name: string,
|};

class Component extends React.Component<Props> {
  render() {
    const { name } = this.props;
    return <div>{name}</div>;
  }
}

export default Component;
