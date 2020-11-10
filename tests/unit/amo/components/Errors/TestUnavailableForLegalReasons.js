import { shallow } from 'enzyme';
import * as React from 'react';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import { UnavailableForLegalReasonsBase } from 'amo/components/Errors/UnavailableForLegalReasons';
import { fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = () => {
    return shallow(<UnavailableForLegalReasonsBase i18n={fakeI18n()} />);
  };

  it('renders a not available error', () => {
    const root = render();

    expect(root.find(ErrorComponent)).toHaveProp('code', 451);
    expect(root.find(ErrorComponent)).toHaveProp(
      'header',
      'Unavailable for legal reasons',
    );

    expect(root.find('p').at(0)).toIncludeText('not available in your region');
  });
});
