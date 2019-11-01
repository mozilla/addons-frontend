/* @flow */
import * as React from 'react';

import NotFound from 'amo/components/Errors/NotFound';
import Page from 'amo/components/Page';

type Props = {|
  errorCode?: string,
|};

const NotFoundPage = (props: Props) => {
  return (
    <Page showWrongPlatformWarning={false}>
      <NotFound {...props} />
    </Page>
  );
};

export default NotFoundPage;
