import * as React from 'react';

import UnavailableForLegalReasons from 'amo/components/Errors/UnavailableForLegalReasons';
import Page from 'amo/components/Page';

const UnavailableForLegalReasonsPage = (): React.ReactNode => {
  return <Page showWrongPlatformWarning={false}>
      <UnavailableForLegalReasons />
    </Page>;
};

export default UnavailableForLegalReasonsPage;