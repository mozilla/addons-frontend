import * as React from 'react';

import CollectionList, {
  CollectionListBase,
} from 'amo/components/CollectionList';
import CollectionManager from 'amo/components/CollectionManager';
import AuthenticateButton from 'core/components/AuthenticateButton';
import {
  fakeI18n,
  fakeRouterLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const getProps = () => ({
    i18n: fakeI18n(),
    location: fakeRouterLocation(),
    store: dispatchClientMetadata().store,
  });

  const renderComponent = ({ ...props } = {}) => {
    const allProps = {
      ...getProps(),
      ...props,
    };

    return shallowUntilTarget(
      <CollectionList {...allProps} />,
      CollectionListBase
    );
  };


  it('configures an AuthenticateButton without a logged in user', () => {
    const root = renderComponent({ creating: true });

    expect(root.find(AuthenticateButton))
      .toHaveProp('location', fakeRouterLocation());
    expect(root.find(AuthenticateButton))
      .toHaveProp('logInText', 'Log in to create a collection');
  });

  it('configures a CollectionManager with a logged in user', () => {
    const { store } = dispatchSignInActions();
    const root = renderComponent({ creating: true, store });

    expect(root.find(CollectionManager)).toHaveProp('creating', true);
  });

  it('passes all props to CollectionManager', () => {
    const anyProp = 'example-property';
    const { store } = dispatchSignInActions();
    const root = renderComponent({ anyProp, creating: true, store });

    expect(root.find(CollectionManager)).toHaveProp('anyProp', anyProp);
  });

  it('shows placeholder text if user is logged in', () => {
    const { store } = dispatchSignInActions();
    const root = renderComponent({ store });
    expect(root.find('.CollectionList-placeholder')).toHaveLength(1);
  });
});
