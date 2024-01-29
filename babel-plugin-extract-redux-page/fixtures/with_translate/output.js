/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import translate from 'amo/i18n/translate';
type Props = {|
  name: string,
|};
function RenderFunction(props: Props) {
  const { name } = props;
  return <div>{name}</div>;
}
class Component extends React.Component<Props> {
  render() {
    return <RenderFunction {...this.props} />;
  }
}
export default (translate()(Component): React.ComponentType<Props>);
