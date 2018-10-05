/* @flow */
import { createBrowserHistory } from 'history';
import React from 'react';

import Root from 'core/components/Root';
import { addQueryParamsToHistory } from 'core/utils';

import { dispatchClientMetadata } from '../../tests/unit/amo/helpers';
import { fakeI18n } from '../../tests/unit/helpers';

const { store } = dispatchClientMetadata();

const history = addQueryParamsToHistory({
  history: createBrowserHistory(),
});

export default function Provider({ story }: Object) {
  return (
    <Root store={store} history={history} i18n={fakeI18n}>
      {story}
    </Root>
  );
}
