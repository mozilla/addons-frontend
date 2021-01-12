import { mount } from 'enzyme';
import * as React from 'react';
import PropTypes from 'prop-types';

import I18nProvider from 'amo/i18n/Provider';
import { fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  class MyComponent extends React.Component {
    static contextTypes = {
      i18n: PropTypes.object.isRequired,
    };

    render() {
      return <p>{this.context.i18n.gettext('Howdy')}</p>;
    }
  }

  function render({ i18n }) {
    return mount(
      <I18nProvider i18n={i18n}>
        <MyComponent />
      </I18nProvider>,
    );
  }

  it('sets the i18n as context', () => {
    const i18n = fakeI18n();

    render({ i18n });

    sinon.assert.calledWith(i18n.gettext, 'Howdy');
  });
});
