/* global document */
import * as React from 'react';

import InfoDialog, { InfoDialogBase } from 'core/components/InfoDialog';
import { showInfoDialog } from 'core/reducers/infoDialog';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    const allProps = {
      i18n: fakeI18n(),
      store: dispatchClientMetadata().store,
      ...props,
    };

    // This is needed because of `react-onclickoutside`, see:
    // https://github.com/mozilla/addons-frontend/issues/5879
    return shallowUntilTarget(<InfoDialog {...allProps} />, InfoDialogBase, {
      // TODO: ideally, we would like to enable the lifecycle methods, but it
      // produces unexpected errors, likely related to Enzyme 3. See:
      // http://airbnb.io/enzyme/docs/guides/migration-from-2-to-3.html#lifecycle-methods.
      shallowOptions: { disableLifecycleMethods: true },
    });
  };

  const createInfoDialogData = (overrides = {}) => {
    return {
      addonName: 'some addon',
      closeAction: sinon.stub(),
      imageURL: 'http://example.org/some-addon.png',
      ...overrides,
    };
  };

  const _showInfoDialog = ({ store, data = {} }) => {
    store.dispatch(showInfoDialog(createInfoDialogData(data)));
  };

  it('renders nothing by default', () => {
    const root = render();

    expect(root.find('.InfoDialog')).toHaveLength(0);
  });

  it('renders an InfoDialog when shown', () => {
    const { store } = dispatchClientMetadata();

    const data = createInfoDialogData({ addonName: 'a test add-on' });
    _showInfoDialog({ store, data });

    const root = render({ store });

    expect(root.find('.InfoDialog')).toHaveLength(1);
    expect(root.find('.InfoDialog')).toHaveProp('role', 'dialog');
    expect(root.find('.InfoDialog-title')).toHaveText('Your add-on is ready');
    expect(root.find('.InfoDialog-description')).toIncludeText(data.addonName);
    expect(root.find('.InfoDialog-logo').find('img')).toHaveProp(
      'src',
      data.imageURL,
    );
    expect(root.find('.InfoDialog-button')).toHaveLength(1);
    expect(root.find('.InfoDialog-button')).toHaveProp(
      'onClick',
      data.closeAction,
    );
  });

  it('should call closeAction func when clicking close', () => {
    const { store } = dispatchClientMetadata();
    const closeAction = sinon.spy();

    const data = createInfoDialogData({ closeAction });
    _showInfoDialog({ store, data });

    const root = render({ store });

    root.find('.InfoDialog-button').simulate('click');

    sinon.assert.calledOnce(closeAction);
  });

  it('should call closeAction func when clicking outside', () => {
    const { store } = dispatchClientMetadata();
    const closeAction = sinon.spy();

    const data = createInfoDialogData({ closeAction });
    _showInfoDialog({ store, data });

    const root = render({ store });

    // Simulate a user who clicks outside the InfoDialog component.
    root.instance().handleClickOutside();

    sinon.assert.calledOnce(closeAction);
  });
});
