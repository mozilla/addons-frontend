import { Children, Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { makeI18n } from 'core/i18n/utils';

/*
 * This Provider expects to be passed the current lang.
 */

class I18nProvider extends Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  static childContextTypes = {
    i18n: PropTypes.object.isRequired,
  }

  getChildContext() {
    return { i18n: this.props.i18n };
  }

  render() {
    const { children } = this.props;
    return Children.only(children);
  }
}

function mapStateToProps({ api, i18n }) {
  return {
    i18n: makeI18n(i18n, api.lang),
  };
}

export default compose(
  connect(mapStateToProps),
)(I18nProvider);
