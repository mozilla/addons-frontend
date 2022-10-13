import * as React from 'react';

import ServerError from 'amo/components/Errors/ServerError';
import Page from 'amo/components/Page';

const ServerErrorPage = (): React.ReactNode => {
  return <Page showWrongPlatformWarning={false}>
      <ServerError />
    </Page>;
};

export default ServerErrorPage;