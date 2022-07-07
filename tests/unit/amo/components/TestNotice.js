import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';

import Notice from 'amo/components/Notice';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import { setUIState as setUIStateAction } from 'amo/reducers/uiState';
import {
  dispatchClientMetadata,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const lang = 'en-US';
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  const render = ({ children, ...props } = {}) => {
    return defaultRender(
      <Notice id="some-id" type="success" {...props}>
        {children}
      </Notice>,
      { store },
    );
  };

  const getNotice = () => screen.getByClassName('Notice');
  const getUIStateId = (id) => `src/amo/components/Notice/index.js-${id}`;

  it('renders a custom class name', () => {
    const className = 'some-class';
    render({ className });

    expect(getNotice()).toHaveClass(className);
  });

  it('renders a class for the type', () => {
    render({ type: 'error' });

    expect(getNotice()).toHaveClass('Notice-error');
  });

  it('renders a class for againstGrey20=true', () => {
    render({ againstGrey20: true });

    expect(getNotice()).toHaveClass('Notice-againstGrey20');
  });

  it('renders children', () => {
    const text = 'some text';
    render({ children: <em>{text}</em> });

    expect(screen.getByTagName('em')).toBeInTheDocument();
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('requires a known type', () => {
    expect(() => render({ type: 'nope' })).toThrow(/Unknown type: nope/);
  });

  it('hides action buttons by default', () => {
    render();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an action button', () => {
    const actionOnClick = jest.fn();
    const actionText = 'some text';
    render({ actionOnClick, actionText });

    const button = screen.getByRole('button', { name: actionText });
    userEvent.click(button);

    expect(actionOnClick).toHaveBeenCalled();
  });

  it('requires actionText when specifying a button action', () => {
    expect(() => render({ actionOnClick: jest.fn() })).toThrow(
      /actionText is required/,
    );
  });

  it('renders a button with a `to` property', () => {
    const actionTo = '/some-relative-link';
    const actionText = 'some text';
    render({ actionTo, actionText });

    expect(screen.getByRole('link', { name: actionText })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}${actionTo}`,
    );
  });

  it('renders a button with an `href` property', () => {
    const actionHref = 'https://example.com';
    const actionText = 'some text';
    render({ actionHref, actionText });

    expect(screen.getByRole('link', { name: actionText })).toHaveAttribute(
      'href',
      actionHref,
    );
  });

  it('calls back when you dismiss a notice', () => {
    const onDismiss = jest.fn();
    render({ dismissible: true, onDismiss });

    userEvent.click(
      screen.getByRole('button', { name: 'Dismiss this notice' }),
    );

    expect(onDismiss).toHaveBeenCalled();
  });

  // eslint-disable-next-line jest/expect-expect
  it('does not require a dismissal callback', () => {
    render({ dismissible: true, onDismiss: undefined });

    // Make sure this doesn't throw.
    userEvent.click(
      screen.getByRole('button', { name: 'Dismiss this notice' }),
    );
  });

  it('changes UI state when dismissing a notice', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    const id = 'example-id';
    render({ id, dismissible: true });

    userEvent.click(
      screen.getByRole('button', { name: 'Dismiss this notice' }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      setUIStateAction({
        id: getUIStateId(id),
        change: { wasDismissed: true },
      }),
    );
  });

  it('hides a dismissed notice', async () => {
    const id = 'example-id';
    render({ id, dismissible: true });

    store.dispatch(
      setUIStateAction({
        id: getUIStateId(id),
        change: { wasDismissed: true },
      }),
    );

    await waitFor(() => {
      expect(screen.queryByClassName('Notice')).not.toBeInTheDocument();
    });
  });

  it('only hides dismissible notices', () => {
    const id = 'example-id';
    render({ id, dismissible: false });

    store.dispatch(
      setUIStateAction({
        id: getUIStateId(id),
        change: { wasDismissed: true },
      }),
    );

    expect(getNotice()).toBeInTheDocument();
  });

  it('requires an ID prop for dismissible notices', () => {
    expect(() => render({ dismissible: true, id: undefined })).toThrow(
      /id property must be defined/,
    );
  });

  it('passes an actionTarget to Button', () => {
    const actionTarget = '_blank';
    const actionText = 'some text';
    render({
      actionHref: 'https://example.com',
      actionTarget,
      actionText,
    });

    expect(screen.getByRole('link', { name: actionText })).toHaveAttribute(
      'target',
      actionTarget,
    );
  });

  it('can render a light notice', () => {
    render({ light: true });

    expect(getNotice()).toHaveClass('Notice-light');
  });
});
