/* @flow */
import * as React from 'react';

import NotAvailableInRegion from 'amo/components/Errors/NotAvailableInRegion';
import Page from 'amo/components/Page';

const NotAvailableInRegionPage = () => {
  return (
    <Page showWrongPlatformWarning={false}>
      <NotAvailableInRegion />
    </Page>
  );
};

export default NotAvailableInRegionPage;
