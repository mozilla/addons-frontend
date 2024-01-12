import * as React from 'react';
import PropTypes from 'prop-types';
import { render as libraryRender } from '@testing-library/react';

import I18nProvider from 'amo/i18n/Provider';
import { fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  class MyComponent extends React.Component {
    static contextTypes = {
      jed: PropTypes.object.isRequired,
    };

    render() {
      return <p>{this.context.jed.gettext('Howdy')}</p>;
    }
  }

  function render({ jed }) {
    return libraryRender(
      <I18nProvider jed={jed}>
        <MyComponent />
      </I18nProvider>,
    );
  }

  it('sets the jed as context', () => {
    const jed = fakeI18n();

    render({ jed });

    expect(jed.gettext).toHaveBeenCalledWith('Howdy');
  });
});
