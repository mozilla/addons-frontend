import { mount } from 'enzyme';
import * as React from 'react';

import ReportAbuseButton, {
  ReportAbuseButtonBase,
} from 'amo/components/ReportAbuseButton';
import { setError } from 'core/actions/errors';
import I18nProvider from 'core/i18n/Provider';
import {
  disableAbuseButtonUI,
  enableAbuseButtonUI,
  loadAddonAbuseReport,
  sendAddonAbuseReport,
} from 'core/reducers/abuse';
import ErrorList from 'ui/components/ErrorList';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import {
  createFakeAddonAbuseReport,
  createFakeEvent,
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const defaultRenderProps = {
    addon: { ...fakeAddon, slug: 'my-addon' },
    errorHandler: createStubErrorHandler(),
    i18n: fakeI18n(),
    store: dispatchClientMetadata().store,
  };

  function renderMount({ ...props } = {}) {
    return mount(
      <I18nProvider i18n={props.i18n || defaultRenderProps.i18n}>
        <ReportAbuseButton {...defaultRenderProps} {...props} />
      </I18nProvider>,
    );
  }

  function renderShallow({ ...props } = {}) {
    return shallowUntilTarget(
      <ReportAbuseButton {...defaultRenderProps} {...props} />,
      ReportAbuseButtonBase,
    );
  }

  it('renders nothing if no add-on exists', () => {
    const root = renderShallow({ addon: null });

    expect(root.find('.ReportAbuseButton')).toHaveLength(0);
  });

  it('renders a button to report an add-on', () => {
    const root = renderShallow();

    expect(root.find('.ReportAbuseButton')).toHaveLength(1);
    expect(root.find('.ReportAbuseButton-show-more').prop('children')).toEqual(
      'Report this add-on for abuse',
    );
    expect(
      root.find('.ReportAbuseButton-send-report').prop('children'),
    ).toEqual('Send abuse report');
  });

  it('renders a textarea with placeholder for the add-on message', () => {
    const root = renderShallow();

    expect(root.find('.ReportAbuseButton-textarea')).toHaveLength(1);
    expect(root.find('.ReportAbuseButton-textarea')).toHaveProp(
      'placeholder',
      'Explain how this add-on is violating our policies.',
    );
  });

  it('shows the preview content when first rendered', () => {
    const root = renderShallow();

    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(0);
  });

  it('shows more content when the "report" button is clicked', () => {
    const fakeEvent = createFakeEvent();
    // We need to use mount here because we're interacting with refs. (In
    // this case, the textarea.)
    const root = renderMount();

    root
      .find('button.ReportAbuseButton-show-more')
      .simulate('click', fakeEvent);

    sinon.assert.called(fakeEvent.preventDefault);
    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(1);
  });

  it('dismisses more content when the "dismiss" button is clicked', () => {
    const fakeEvent = createFakeEvent();
    // We need to use mount here because we're interacting with refs. (In
    // this case, the textarea.)
    const root = renderMount();

    root
      .find('button.ReportAbuseButton-show-more')
      .simulate('click', fakeEvent);

    root.find('.ReportAbuseButton-dismiss-report').simulate('click', fakeEvent);

    sinon.assert.called(fakeEvent.preventDefault);
    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(0);
  });

  it('disables the submit button if there is no abuse report', () => {
    const root = renderShallow();

    expect(root.find('.ReportAbuseButton-send-report').first()).toHaveProp(
      'disabled',
    );
  });

  it('disables the submit button if text in the textarea is removed', () => {
    const root = renderMount();

    // This simulates entering text into the textarea.
    const textarea = root.find('.ReportAbuseButton-textarea > textarea');
    textarea.instance().value = 'add-on ate my homework!';
    textarea.simulate('change');

    expect(
      root
        .find('.ReportAbuseButton-send-report')
        .first()
        .prop('disabled'),
    ).toEqual(false);

    textarea.instance().value = '';
    textarea.simulate('change');

    expect(
      root
        .find('.ReportAbuseButton-send-report')
        .first()
        .prop('disabled'),
    ).toEqual(true);
  });

  it('disables the buttons while sending the abuse report', () => {
    const addon = { ...fakeAddon, slug: 'bank-machine-skimmer' };
    const fakeEvent = createFakeEvent();
    const { store } = dispatchClientMetadata();
    store.dispatch(
      sendAddonAbuseReport({
        addonSlug: addon.slug,
        errorHandlerId: 'my-error',
        message: 'All my money is gone',
      }),
    );
    const root = renderMount({ addon, store });

    // Expand the view so we can test that it wasn't contracted when
    // clicking on the disabled "dismiss" link.
    root
      .find('button.ReportAbuseButton-show-more')
      .simulate('click', fakeEvent);
    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(1);

    const dismissButton = root.find('.ReportAbuseButton-dismiss-report');
    const sendButton = root.find('button.ReportAbuseButton-send-report');

    expect(dismissButton).toHaveClassName(
      'ReportAbuseButton-dismiss-report--disabled',
    );
    expect(sendButton.prop('disabled')).toEqual(true);
    expect(sendButton.prop('children')).toEqual('Sending abuse report');

    dismissButton.simulate('click', fakeEvent);
    sinon.assert.called(fakeEvent.preventDefault);
    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(1);
  });

  it('shows a success message and hides the button if report was sent', () => {
    const addon = { ...fakeAddon, slug: 'bank-machine-skimmer' };
    const { store } = dispatchClientMetadata();
    const abuseResponse = createFakeAddonAbuseReport({
      addon,
      message: 'Seriously, where is my money?!',
    });
    store.dispatch(loadAddonAbuseReport(abuseResponse));
    const root = renderShallow({ addon, store });

    expect(root.find('.ReportAbuseButton--report-sent')).toHaveLength(1);
    expect(root.find('.ReportAbuseButton-show-more')).toHaveLength(0);
    expect(root.find('button.ReportAbuseButton-send-report')).toHaveLength(0);
  });

  it('dispatches when the send button is clicked if textarea has text', () => {
    const addon = { ...fakeAddon, slug: 'which-browser' };
    const fakeEvent = createFakeEvent();
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = renderMount({ addon, store });

    // This simulates entering text into the textarea.
    const textarea = root.find('.ReportAbuseButton-textarea > textarea');
    textarea.instance().value = 'Opera did it first!';
    textarea.simulate('change');

    root
      .find('button.ReportAbuseButton-send-report')
      .simulate('click', fakeEvent);
    sinon.assert.calledWith(
      dispatchSpy,
      sendAddonAbuseReport({
        addonSlug: addon.slug,
        errorHandlerId: 'create-stub-error-handler-id',
        message: 'Opera did it first!',
      }),
    );
    sinon.assert.called(fakeEvent.preventDefault);
  });

  it('enables the submit button if there is text in the textarea', () => {
    const addon = { ...fakeAddon, slug: 'which-browser' };
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = renderMount({ addon, store });

    // Make sure it's disabled by default.
    expect(
      root.find('button.ReportAbuseButton-send-report').prop('disabled'),
    ).toEqual(true);

    // This simulates entering text into the textarea.
    const textarea = root.find('.ReportAbuseButton-textarea > textarea');
    textarea.instance().value = 'Opera did it first!';
    textarea.simulate('change');

    sinon.assert.calledWith(dispatchSpy, enableAbuseButtonUI({ addon }));
    expect(
      root.find('button.ReportAbuseButton-send-report').prop('disabled'),
    ).toEqual(false);
  });

  it('does not dispatch enableAbuseButtonUI if button already enabled', () => {
    const addon = { ...fakeAddon, slug: 'which-browser' };
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = renderMount({ addon, store });

    // This simulates entering text into the textarea.
    const textarea = root.find('.ReportAbuseButton-textarea > textarea');
    textarea.instance().value = 'Opera did it first!';
    textarea.simulate('change');

    sinon.assert.calledWith(dispatchSpy, enableAbuseButtonUI({ addon }));

    // Ensure `enableAbuseButtonUI()` isn't called again.
    dispatchSpy.resetHistory();

    // This simulates entering text into the textarea.
    textarea.instance().value = 'Opera did it first! Adding some text!';
    textarea.simulate('change');

    sinon.assert.neverCalledWith(dispatchSpy, enableAbuseButtonUI({ addon }));
  });

  it('does not dispatch enableAbuseButtonUI if textarea is whitespace', () => {
    const addon = { ...fakeAddon, slug: 'which-browser' };
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = renderMount({ addon, store });

    // This simulates entering text into the textarea.
    const textarea = root.find('.ReportAbuseButton-textarea > textarea');
    textarea.instance().value = '      ';
    textarea.simulate('change');

    sinon.assert.neverCalledWith(dispatchSpy, enableAbuseButtonUI({ addon }));
    expect(
      root.find('button.ReportAbuseButton-send-report').prop('disabled'),
    ).toEqual(true);
  });

  it('disables the submit button if there is no text in the textarea', () => {
    const addon = { ...fakeAddon, slug: 'which-browser' };
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = renderMount({ addon, store });

    // This simulates entering text into the textarea.
    const textarea = root.find('.ReportAbuseButton-textarea > textarea');
    textarea.instance().value = 'Opera did it first!';
    textarea.simulate('change');

    textarea.instance().value = '';
    textarea.simulate('change');

    sinon.assert.calledWith(dispatchSpy, disableAbuseButtonUI({ addon }));
    expect(
      root.find('button.ReportAbuseButton-send-report').prop('disabled'),
    ).toEqual(true);
  });

  it('disables the submit button if there is empty text in the textarea', () => {
    const addon = { ...fakeAddon, slug: 'which-browser' };
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = renderMount({ addon, store });

    // This simulates entering text into the textarea.
    const textarea = root.find('.ReportAbuseButton-textarea > textarea');
    textarea.instance().value = 'Opera did it first!';
    textarea.simulate('change');

    textarea.instance().value = '        ';
    textarea.simulate('change');

    sinon.assert.calledWith(dispatchSpy, disableAbuseButtonUI({ addon }));
    expect(
      root.find('button.ReportAbuseButton-send-report').prop('disabled'),
    ).toEqual(true);
  });

  // This is a bit of a belt-and-braces approach, as the button that
  // activates this function is disabled when the textarea is empty.
  it('does not allow dispatch if there is no content in the textarea', () => {
    const addon = { ...fakeAddon, slug: 'this-should-not-happen' };
    const fakeEvent = createFakeEvent();
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    // We enable the button with an empty textarea; this never happens
    // normally but we can force it here for testing.
    store.dispatch(enableAbuseButtonUI({ addon }));
    dispatchSpy.resetHistory();
    fakeEvent.preventDefault.resetHistory();

    const root = renderMount({ addon, store });

    // Make sure the button isn't disabled.
    expect(
      root
        .find('.ReportAbuseButton-send-report')
        .first()
        .prop('disabled'),
    ).toEqual(false);
    root
      .find('button.ReportAbuseButton-send-report')
      .simulate('click', fakeEvent);

    sinon.assert.notCalled(dispatchSpy);
    // Make sure preventDefault was called; we then know the sendReport()
    // method was called.
    sinon.assert.called(fakeEvent.preventDefault);
  });

  it('renders an error if one exists', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();
    store.dispatch(
      setError({
        error: new Error('something bad'),
        id: errorHandler.id,
      }),
    );
    const root = renderShallow({ errorHandler, store });

    expect(root.find(ErrorList)).toHaveLength(1);
  });
});
