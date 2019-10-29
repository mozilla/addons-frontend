/* @flow */
import * as React from 'react';
import NestedStatus from 'react-nested-status';

import ServerError from 'amo/components/Errors/ServerError';
import Page from 'amo/components/Page';

const ServerErrorPage = () => {
  return (
    <NestedStatus code={500}>
      <Page showWrongPlatformWarning={false}>
        <ServerError />
      </Page>
    </NestedStatus>
  );
};

export default ServerErrorPage;
