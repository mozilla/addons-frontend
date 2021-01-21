/* @flow */
import * as React from 'react';

import NotAuthorized from 'amo/components/Errors/NotAuthorized';
import Page from 'amo/components/Page';

const NotAuthorizedPage = (): React.Node => {
  return (
    <Page showWrongPlatformWarning={false}>
      <NotAuthorized />
    </Page>
  );
};

export default NotAuthorizedPage;
