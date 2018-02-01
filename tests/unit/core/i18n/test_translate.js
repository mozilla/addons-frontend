/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import PropTypes from 'prop-types';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-dom/test-utils';

import I18nProvider from 'core/i18n/Provider';
import translate from 'core/i18n/translate';
import { fakeI18n } from 'tests/unit/helpers';


class OuterComponent extends React.Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
  }
  render() {
    const { children } = this.props;
    return <div>{children}</div>;
  }
}

class InnerComponent extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }
  render() {
    const { i18n } = this.props;
    return <div>{i18n.gettext('hai')}</div>;
  }
}

describe('translate()', () => {
  function render({
    Component = translate()(InnerComponent),
    i18n = fakeI18n(),
    componentProps = {},
  } = {}) {
    return renderIntoDocument(
      <I18nProvider i18n={i18n}>
        <OuterComponent>
          <Component {...componentProps} />
        </OuterComponent>
      </I18nProvider>
    );
  }

  it('pulls i18n from context', () => {
    const i18n = fakeI18n();
    render({ i18n });
    expect(i18n.gettext.called).toBeTruthy();
  });

  it('overrides the i18n from props', () => {
    const contextI18n = fakeI18n();
    const propsI18n = fakeI18n();
    render({ i18n: contextI18n, componentProps: { i18n: propsI18n } });
    expect(contextI18n.gettext.called).toBeFalsy();
    expect(propsI18n.gettext.called).toBeTruthy();
  });

  it('throws an exception calling getWrappedInstance without withRef', () => {
    const Component = translate()(InnerComponent);
    const root = render({ Component });
    const wrappedComponent = findRenderedComponentWithType(root, Component);
    expect(() => {
      wrappedComponent.getWrappedInstance();
    }).toThrowError('To access the wrapped instance');
  });

  it('returns the wrapped instance when using withRef', () => {
    const Component = translate({ withRef: true })(InnerComponent);
    const root = render({ Component });
    const wrappedComponent = findRenderedComponentWithType(root, Component);
    const component = wrappedComponent.getWrappedInstance();
    expect(component).toBeInstanceOf(InnerComponent);
  });
});
