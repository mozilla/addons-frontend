import { mount } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import ErrorPage, { ErrorPageBase } from 'amo/components/ErrorPage';
import { createApiError } from 'amo/api';
import { loadErrorPage } from 'amo/reducers/errorPage';
import { getErrorComponent } from 'amo/utils/errors';
import {
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import I18nProvider from 'amo/i18n/Provider';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const getProps = (customProps = {}) => {
    return {
      i18n: fakeI18n(),
      store,
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const props = getProps(customProps);
    return shallowUntilTarget(<ErrorPage {...props} />, ErrorPageBase);
  };

  const renderAndMount = (customProps = {}) => {
    const props = getProps(customProps);
    return mount(
      <Provider store={props.store}>
        <I18nProvider i18n={props.i18n}>
          <ErrorPage {...props} />
        </I18nProvider>
      </Provider>,
    );
  };

  it('renders children when there are no errors', () => {
    const root = render({ children: <p className="content">hello</p> });

    expect(root.find('.content')).toHaveLength(1);
  });

  it('renders an error page on error', () => {
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 404 },
    });
    store.dispatch(loadErrorPage({ error }));

    const root = render({ children: <p className="content">hello</p> });

    expect(root.find('.content')).toHaveLength(0);
    const expectedError = getErrorComponent(404);

    const errorComponent = root.find(expectedError);
    expect(errorComponent).toHaveLength(1);
    expect(errorComponent).toHaveProp('status', 404);
    expect(errorComponent).toHaveProp('error', error);
  });

  it('catches and reports errors in child components', () => {
    const error = new Error('random error');

    const Content = () => {
      throw error;
    };

    const dispatchStub = sinon.stub(store, 'dispatch');
    renderAndMount({ children: <Content /> });

    sinon.assert.calledWith(dispatchStub, loadErrorPage({ error }));
  });
});
