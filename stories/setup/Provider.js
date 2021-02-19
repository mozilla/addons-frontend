/* @flow */
import { createBrowserHistory } from 'history';
import React from 'react';
import type { Node } from 'react';

import { dispatchClientMetadata, fakeI18n } from 'tests/unit/helpers';
import Root from 'amo/components/Root';
import { addQueryParamsToHistory } from 'amo/utils';

const { store } = dispatchClientMetadata();

const history = addQueryParamsToHistory({
  history: createBrowserHistory(),
});

export default function Provider({ story }: Object): Node {
  return (
    <Root
      store={store}
      history={history}
      i18n={fakeI18n({ includeJedSpy: false })}
    >
      {story}
    </Root>
  );
}
