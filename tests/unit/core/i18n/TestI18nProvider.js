import * as React from 'react';
import PropTypes from 'prop-types';
import {
  renderIntoDocument,
} from 'react-dom/test-utils';

import I18nProvider from 'core/i18n/Provider';
import { fakeI18n } from 'tests/unit/helpers';


describe('I18nProvider', () => {
  class MyComponent extends React.Component {
    static contextTypes = {
      i18n: PropTypes.object.isRequired,
    };

    render() {
      return <p>{this.context.i18n.gettext('Howdy')}</p>;
    }
  }

  function render({ i18n }) {
    return renderIntoDocument(
      <I18nProvider i18n={i18n}>
        <MyComponent />
      </I18nProvider>
    );
  }

  it('sets the i18n as context', () => {
    const i18n = fakeI18n();
    render({ i18n });
    expect(i18n.gettext.calledWith('Howdy')).toBeTruthy();
  });
});
