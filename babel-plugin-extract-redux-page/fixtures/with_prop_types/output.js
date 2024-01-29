/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import translate from 'amo/i18n/translate';
function RenderFunction(props) {
  const { name } = props;
  return (
    <div>
      {name} {props.renderFoo()}
    </div>
  );
}
RenderFunction.propTypes = {
  name: PropTypes.string.isRequired,
  renderFoo: PropTypes.func.isRequired,
};
class Component extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    renderFoo: PropTypes.func.isRequired,
  };
  renderFoo() {
    return null;
  }
  render() {
    return <RenderFunction {...this.props} renderFoo={this.renderFoo} />;
  }
}
export default Component;
