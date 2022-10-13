import { Children, Component } from 'react';
import PropTypes from 'prop-types';
/*
 * This Provider expects to be passed an initialized
 * Jed i18n object,
 */

export default class I18nProvider extends Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
  };

  static childContextTypes = {
    i18n: PropTypes.object.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.i18n = props.i18n;
  }

  getChildContext() {
    return {
      i18n: this.i18n,
    };
  }

  render() {
    const {
      children,
    } = this.props;
    return Children.only(children);
  }

}