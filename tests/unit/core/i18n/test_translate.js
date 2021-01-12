/* eslint-disable react/no-multi-comp, max-classes-per-file */
import { mount } from 'enzyme';
import * as React from 'react';
import PropTypes from 'prop-types';

import I18nProvider from 'amo/i18n/Provider';
import translate from 'amo/i18n/translate';
import { fakeI18n } from 'tests/unit/helpers';

class OuterComponent extends React.Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
  };

  render() {
    const { children } = this.props;
    return <div>{children}</div>;
  }
}

class InnerComponent extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  };

  render() {
    const { i18n } = this.props;
    return <div>{i18n.gettext('hai')}</div>;
  }
}

describe(__filename, () => {
  const render = ({
    Component = translate()(InnerComponent),
    i18n = fakeI18n(),
    componentProps = {},
  } = {}) => {
    return mount(
      <I18nProvider i18n={i18n}>
        <OuterComponent>
          <Component {...componentProps} />
        </OuterComponent>
      </I18nProvider>,
      InnerComponent,
    );
  };

  it('pulls i18n from context', () => {
    const i18n = fakeI18n();
    render({ i18n });
    sinon.assert.called(i18n.gettext);
  });

  it('overrides the i18n from props', () => {
    const contextI18n = fakeI18n();
    const propsI18n = fakeI18n();
    render({ i18n: contextI18n, componentProps: { i18n: propsI18n } });
    sinon.assert.notCalled(contextI18n.gettext);
    sinon.assert.called(propsI18n.gettext);
  });
});
