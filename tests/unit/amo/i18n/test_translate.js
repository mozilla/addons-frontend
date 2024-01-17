/* eslint-disable react/no-multi-comp, max-classes-per-file */
import * as React from 'react';
import PropTypes from 'prop-types';
import { render as libraryRender } from '@testing-library/react';

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
    jed: PropTypes.object.isRequired,
  };

  render() {
    const { jed } = this.props;
    return <div>{jed.gettext('hai')}</div>;
  }
}

describe(__filename, () => {
  const render = ({
    Component = translate()(InnerComponent),
    jed = fakeI18n(),
    componentProps = {},
  } = {}) => {
    return libraryRender(
      <I18nProvider jed={jed}>
        <OuterComponent>
          <Component {...componentProps} />
        </OuterComponent>
      </I18nProvider>,
      InnerComponent,
    );
  };

  it('pulls jed from context', () => {
    const jed = fakeI18n();
    render({ jed });
    expect(jed.gettext).toHaveBeenCalled();
  });

  it('overrides the jed from props', () => {
    const contextI18n = fakeI18n();
    const propsI18n = fakeI18n();
    render({ jed: contextI18n, componentProps: { jed: propsI18n } });
    expect(contextI18n.gettext).not.toHaveBeenCalled();
    expect(propsI18n.gettext).toHaveBeenCalled();
  });
});
