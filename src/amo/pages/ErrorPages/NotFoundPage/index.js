/* @flow */
import * as React from 'react';
import NestedStatus from 'react-nested-status';

import NotFound from 'amo/components/Errors/NotFound';
import Page from 'amo/components/Page';

type Props = {|
  errorCode?: string,
|};

const NotFoundPage = (props: Props) => {
  return (
    <NestedStatus code={404}>
      <Page showWrongPlatformWarning={false}>
        <NotFound {...props} />
      </Page>
    </NestedStatus>
  );
};

export default NotFoundPage;
