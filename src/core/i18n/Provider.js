import { Children, Component, PropTypes } from 'react';

/*
 * This Provider expects to be passed an initialized
 * Jed i18n object,
 */

export default class I18nProvider extends Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
  }

  static childContextTypes = {
    i18n: PropTypes.object.isRequired,
  }

  constructor(props, context) {
    super(props, context);
    this.i18n = props.i18n;
  }

  getChildContext() {
    return { i18n: this.i18n };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.i18n !== nextProps.i18n) {
      throw new Error('Mutating the i18n object is not allowed');
    }
  }

  render() {
    const { children } = this.props;
    return Children.only(children);
  }
}
