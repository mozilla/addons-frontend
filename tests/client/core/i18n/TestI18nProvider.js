/* eslint-disable react/no-multi-comp */
import React, { Component, PropTypes } from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';

import I18nProvider from 'core/i18n/Provider';
import translate from 'core/i18n/translate';
import { getFakeI18nInst } from 'tests/client/helpers';


class OuterComponent extends Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
  }
  render() {
    const { children } = this.props;
    return <div>{children}</div>;
  }
}

class InnerComponent extends Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }
  render() {
    const { i18n } = this.props;
    return <div>{i18n.gettext('hai')}</div>;
  }
}


describe('I18nProvider', () => {
  let i18nInst;
  let MyComponent;

  function render(props) {
    const defaultProps = {
      i18n: getFakeI18nInst(),
      MyComponent: translate()(InnerComponent),
      ...props,
    };

    MyComponent = defaultProps.MyComponent;
    i18nInst = defaultProps.i18n;

    return renderIntoDocument(
      <I18nProvider i18n={defaultProps.i18n}>
        <OuterComponent>
          <MyComponent />
        </OuterComponent>
      </I18nProvider>
    );
  }

  it('should call i18n.gettext in the component view', () => {
    render();
    assert.ok(i18nInst.gettext.called);
  });

  it('should see an exception calling getWrappedInstance without withRef', () => {
    const root = render();
    const wrappedComponent = findRenderedComponentWithType(root, MyComponent);
    assert.throws(() => {
      wrappedComponent.getWrappedInstance();
    }, Error, 'To access the wrapped instance');
  });
});
