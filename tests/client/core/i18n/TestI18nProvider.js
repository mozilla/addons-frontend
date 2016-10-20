import React, { PropTypes } from 'react';
import {
  renderIntoDocument,
} from 'react-addons-test-utils';

import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/client/helpers';


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
    const i18n = getFakeI18nInst();
    render({ i18n });
    assert.ok(i18n.gettext.calledWith('Howdy'));
  });
});
