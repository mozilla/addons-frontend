/* @flow */
import * as React from 'react';
import NestedStatus from 'react-nested-status';

import NotAuthorized from 'amo/components/Errors/NotAuthorized';
import Page from 'amo/components/Page';

const NotAuthorizedPage = () => {
  return (
    <NestedStatus code={401}>
      <Page showWrongPlatformWarning={false}>
        <NotAuthorized />
      </Page>
    </NestedStatus>
  );
};

export default NotAuthorizedPage;
