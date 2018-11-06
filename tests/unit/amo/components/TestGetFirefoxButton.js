import * as React from 'react';

import GetFirefoxButton, {
  GetFirefoxButtonBase,
} from 'amo/components/GetFirefoxButton';
import { makeQueryStringWithUTM } from 'amo/utils';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon, fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import Button from 'ui/components/Button';

describe(__filename, () => {
  it('sets the href on the button with the guid of the add-on', () => {
    const guid = 'some-guid';
    const addon = createInternalAddon({ ...fakeAddon, guid });
    const expectedHref = `https://www.mozilla.org/firefox/new/${makeQueryStringWithUTM(
      { utm_content: addon.guid },
    )}`;
    const root = shallowUntilTarget(
      <GetFirefoxButton addon={addon} i18n={fakeI18n()} />,
      GetFirefoxButtonBase,
    );

    expect(root.find(Button)).toHaveProp('href', expectedHref);
  });
});
