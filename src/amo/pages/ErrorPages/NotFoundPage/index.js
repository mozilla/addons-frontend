/* @flow */
import * as React from 'react';

import NotFound from 'amo/components/Errors/NotFound';
import Page from 'amo/components/Page';

const NotFoundPage = () => {
  return (
    <Page showWrongPlatformWarning={false}>
      <NotFound />
    </Page>
  );
};

export default NotFoundPage;
