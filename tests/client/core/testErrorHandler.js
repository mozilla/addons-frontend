import React, { PropTypes } from 'react';
import { findRenderedComponentWithType, renderIntoDocument }
  from 'react-addons-test-utils';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';

import translate from 'core/i18n/translate';
import { ErrorHandler, withErrorHandling } from 'core/errorHandler';
import errors from 'core/reducers/errors';

class SomeComponentBase extends React.Component {
  static propTypes = {
    errorHandler: PropTypes.object,
  }
  render() {
    return <div />;
  }
}

function createWrappedComponent() {
  const SomeComponent = translate({ withRef: true })(SomeComponentBase);
  const ComponentWithErrorHandling =
    withErrorHandling({ name: 'SomeComponent' })(SomeComponent);

  const store = createStore(combineReducers({ errors }));

  const component = findRenderedComponentWithType(renderIntoDocument(
    <Provider store={store}>
      <ComponentWithErrorHandling />
    </Provider>
  ), SomeComponent).getWrappedInstance();

  return { store, component };
}

describe('errorHandler', () => {
  describe('withErrorHandling', () => {
    it('provides a unique errorHandler property', () => {
      const { component } = createWrappedComponent();
      const errorHandler = component.props.errorHandler;
      assert.instanceOf(errorHandler, ErrorHandler);
      assert.match(errorHandler.generateId(), /^SomeComponent-/);
    });
  });
});
