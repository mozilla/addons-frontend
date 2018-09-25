import * as React from 'react';

import { setUIState as setUIStateAction } from 'core/reducers/uiState';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
  setUIState,
} from 'tests/unit/helpers';
import Notice, { NoticeBase } from 'ui/components/Notice';

const render = ({
  store = dispatchClientMetadata().store,
  children,
  ...customProps
} = {}) => {
  const props = {
    id: 'example-id',
    store,
    i18n: fakeI18n(),
    type: 'success',
    ...customProps,
  };
  return shallowUntilTarget(<Notice {...props}>{children}</Notice>, NoticeBase);
};

describe(__filename, () => {
  it('renders a custom class name', () => {
    const root = render({ className: 'some-class' });

    expect(root).toHaveClassName('some-class');
    expect(root).toHaveClassName('Notice');
  });

  it('renders a class for the type', () => {
    const root = render({ type: 'error' });

    expect(root).toHaveClassName('Notice-error');
  });

  it('renders children', () => {
    const root = render({ children: <em>Some text</em> });

    expect(root.find('em')).toHaveLength(1);
    expect(root.text()).toEqual('Some text');
  });

  it('requires a known type', () => {
    expect(() => render({ type: 'nope' })).toThrow(/Unknown type: nope/);
  });

  it('hides action buttons by default', () => {
    const root = render();

    expect(root.find('.Notice-button')).toHaveLength(0);
  });

  it('renders an action button', () => {
    const actionOnClick = sinon.stub();
    const root = render({ actionOnClick, actionText: 'some text' });

    const button = root.find('.Notice-button');
    expect(button).toHaveLength(1);
    expect(button.html()).toContain('some text');

    button.simulate('click', createFakeEvent());
    sinon.assert.called(actionOnClick);
  });

  it('requires actionText when specifying a button action', () => {
    expect(() => render({ actionOnClick: sinon.stub() })).toThrow(
      /actionText is required/,
    );
  });

  it('renders a button with a `to` property', () => {
    const actionTo = '/some-relative-link';
    const root = render({ actionTo, actionText: 'a button link' });

    const button = root.find('.Notice-button');
    expect(button).toHaveProp('to', actionTo);
  });

  it('renders a button with an `href` property', () => {
    const actionHref = 'https://example.com';
    const root = render({ actionHref, actionText: 'a button link' });

    const button = root.find('.Notice-button');
    expect(button).toHaveProp('href', actionHref);
  });

  it('calls back when you dismiss a notice', () => {
    const onDismiss = sinon.stub();
    const root = render({ dismissible: true, onDismiss });

    const event = createFakeEvent();
    root.find('.Notice-dismisser-button').simulate('click', event);
    sinon.assert.calledWith(onDismiss, event);
  });

  it('does not require a dismissal callback', () => {
    const root = render({ dismissible: true, onDismiss: undefined });

    // Make sure this doesn't throw.
    root.find('.Notice-dismisser-button').simulate('click', createFakeEvent());
  });

  it('changes UI state when dismissing a notice', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const uiStateID = 'example-id';
    const root = render({ store, uiStateID, dismissible: true });

    dispatchSpy.resetHistory();
    root.find('.Notice-dismisser-button').simulate('click', createFakeEvent());

    sinon.assert.calledWith(
      dispatchSpy,
      setUIStateAction({
        id: uiStateID,
        change: { wasDismissed: true },
      }),
    );
  });

  it('hides a dismissed notice', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store, dismissible: true });
    setUIState({ root, store, change: { wasDismissed: true } });

    expect(root.find('.Notice')).toHaveLength(0);
  });

  it('only hides dismissible notices', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store, dismissible: false });
    setUIState({ root, store, change: { wasDismissed: true } });

    expect(root.find('.Notice')).toHaveLength(1);
  });

  it('requires an ID prop for dismissible notices', () => {
    expect(() => render({ dismissible: true, id: undefined })).toThrow(
      /id property must be defined/,
    );
  });

  it('sets a uiStateID based on ID prop', () => {
    const id = 'notice-id';
    const root = render({ dismissible: true, id });
    expect(root.instance().props.uiStateID).toContain(id);
  });

  it('passes an actionTarget to Button', () => {
    const actionTarget = '_blank';
    const root = render({
      actionText: 'some button',
      actionHref: 'https://example.com',
      actionTarget,
    });

    const button = root.find('.Notice-button');
    expect(button).toHaveProp('target', actionTarget);
  });

  it('can render a light notice', () => {
    const root = render({ light: true });

    expect(root).toHaveClassName('Notice-light');
  });
});
