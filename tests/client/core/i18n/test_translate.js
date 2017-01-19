/* eslint-disable react/no-multi-comp */
import React, { PropTypes } from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';

import translate from 'core/i18n/translate';
import { getFakeI18nInst } from 'tests/client/helpers';


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
    componentProps = {},
  } = {}) {
    return renderIntoDocument(
      <OuterComponent>
        <Component {...componentProps} />
      </OuterComponent>
    );
  }

  it('pulls i18n from context', () => {
    const i18n = getFakeI18nInst();
    render({ i18n });
    assert.ok(i18n.gettext.called);
  });

  it('overrides the i18n from props', () => {
    const contextI18n = getFakeI18nInst();
    const propsI18n = getFakeI18nInst();
    render({ i18n: contextI18n, componentProps: { i18n: propsI18n } });
    assert.notOk(contextI18n.gettext.called);
    assert.ok(propsI18n.gettext.called);
  });

  it('throws an exception calling getWrappedInstance without withRef', () => {
    const Component = translate()(InnerComponent);
    const root = render({ Component });
    const wrappedComponent = findRenderedComponentWithType(root, Component);
    assert.throws(() => {
      wrappedComponent.getWrappedInstance();
    }, Error, 'To access the wrapped instance');
  });

  it('returns the wrapped instance when using withRef', () => {
    const Component = translate({ withRef: true })(InnerComponent);
    const root = render({ Component });
    const wrappedComponent = findRenderedComponentWithType(root, Component);
    const component = wrappedComponent.getWrappedInstance();
    assert.instanceOf(component, InnerComponent);
  });
});
