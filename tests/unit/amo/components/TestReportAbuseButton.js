import * as React from 'react';

import ReportAbuseButton, {
  ReportAbuseButtonBase,
} from 'amo/components/ReportAbuseButton';
import { setError } from 'amo/actions/errors';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
} from 'amo/constants';
import {
  initiateAddonAbuseReportViaFirefox,
  loadAddonAbuseReport,
  sendAddonAbuseReport,
  showAddonAbuseReportUI,
  hideAddonAbuseReportUI,
} from 'amo/reducers/abuse';
import Button from 'amo/components/Button';
import ErrorList from 'amo/components/ErrorList';
import DismissibleTextForm from 'amo/components/DismissibleTextForm';
import {
  createFakeAddonAbuseReport,
  createFakeEvent,
  createInternalAddonWithLang,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const defaultRenderProps = {
    _hasAbuseReportPanelEnabled: sinon.stub(),
    addon: createInternalAddonWithLang({ ...fakeAddon, slug: 'my-addon' }),
    errorHandler: createStubErrorHandler(),
    i18n: fakeI18n(),
    store: dispatchClientMetadata().store,
  };

  function renderShallow({ ...props } = {}) {
    return shallowUntilTarget(
      <ReportAbuseButton {...defaultRenderProps} {...props} />,
      ReportAbuseButtonBase,
    );
  }

  it('renders a DismissibleTextForm to report an add-on', () => {
    const root = renderShallow();

    expect(root.find('.ReportAbuseButton')).toHaveLength(1);
    expect(root.find('.ReportAbuseButton-show-more').prop('children')).toEqual(
      'Report this add-on for abuse',
    );
    expect(root.find('.ReportAbuseButton-show-more')).toHaveProp(
      'disabled',
      false,
    );
    expect(root.find(DismissibleTextForm)).toHaveProp(
      'submitButtonText',
      'Send abuse report',
    );
    expect(root.find(DismissibleTextForm)).toHaveProp(
      'dismissButtonText',
      'Dismiss',
    );
    expect(root.find(DismissibleTextForm)).toHaveProp(
      'placeholder',
      'Explain how this add-on is violating our policies.',
    );
    expect(root.find(DismissibleTextForm)).toHaveProp(
      'submitButtonInProgressText',
      'Sending abuse report',
    );
  });

  it('shows the preview content when first rendered', () => {
    const root = renderShallow();

    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(0);
  });

  it('dispatches hideAddonAbuseReportUI when "onDismiss" is called', () => {
    const addon = { ...fakeAddon, slug: 'my-addon-hide-UI' };
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = renderShallow({ addon, store });

    root.find(DismissibleTextForm).prop('onDismiss')();

    sinon.assert.calledWith(dispatchSpy, hideAddonAbuseReportUI({ addon }));
  });

  it('dispatches sendAddonAbuseReport when "onSubmit" is called', () => {
    const addon = { ...fakeAddon, slug: 'my-addon-send-report' };
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const message = 'This is abuse report';
    const root = renderShallow({ addon, store });

    root.find(DismissibleTextForm).prop('onSubmit')({
      event: createFakeEvent(),
      text: message,
    });

    sinon.assert.calledWith(
      dispatchSpy,
      sendAddonAbuseReport({
        addonSlug: addon.slug,
        errorHandlerId: root.instance().props.errorHandler.id,
        message,
      }),
    );
  });

  it('shows more content when the "report" button is clicked if reporting via Firefox is unsupported', () => {
    const _hasAbuseReportPanelEnabled = sinon.stub().returns(false);
    const addon = { ...fakeAddon, slug: 'my-addon-show-UI' };
    const fakeEvent = createFakeEvent();
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    let root = renderShallow({
      _hasAbuseReportPanelEnabled,
      addon,
      store,
    });

    root.find(Button).simulate('click', fakeEvent);

    sinon.assert.called(fakeEvent.preventDefault);
    sinon.assert.calledWith(dispatchSpy, showAddonAbuseReportUI({ addon }));

    root = renderShallow({ addon, store });
    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(1);
  });

  it.each([ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME])(
    'initiates an abuse report via Firefox when the "report" button is clicked if supported and add-on type is %s',
    (addonType) => {
      const _hasAbuseReportPanelEnabled = sinon.stub().returns(true);
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        type: addonType,
      });
      const fakeEvent = createFakeEvent();
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = renderShallow({
        _hasAbuseReportPanelEnabled,
        addon,
        store,
      });

      root.find(Button).simulate('click', fakeEvent);

      sinon.assert.called(fakeEvent.preventDefault);
      sinon.assert.calledWith(
        dispatchSpy,
        initiateAddonAbuseReportViaFirefox({ addon }),
      );
    },
  );

  it.each([ADDON_TYPE_DICT, ADDON_TYPE_LANG])(
    'does not initiate an abuse report via Firefox when add-on type is %s',
    (addonType) => {
      const _hasAbuseReportPanelEnabled = sinon.stub().returns(true);
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        type: addonType,
      });
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.spy(store, 'dispatch');

      const root = renderShallow({
        _hasAbuseReportPanelEnabled,
        addon,
        store,
      });
      root.find(Button).simulate('click', createFakeEvent());

      sinon.assert.calledWith(dispatchSpy, showAddonAbuseReportUI({ addon }));
    },
  );

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

  it('shows a success message and hides the button if report via Firefox was dispatched', () => {
    const addon = fakeAddon;
    const { store } = dispatchClientMetadata();

    store.dispatch(
      loadAddonAbuseReport({
        addon: { guid: addon.guid, id: addon.id, slug: addon.slug },
        message: null,
        reporter: null,
      }),
    );
    const root = renderShallow({ addon, store });

    expect(root.find('.ReportAbuseButton--report-sent')).toHaveLength(1);
    expect(root.find('.ReportAbuseButton-show-more')).toHaveLength(0);
    expect(root.find('button.ReportAbuseButton-send-report')).toHaveLength(0);
  });

  it('does not disable the "Report this add-on for abuse" button if a report is in progress', () => {
    // See https://github.com/mozilla/addons-frontend/issues/9086.
    const { store } = dispatchClientMetadata();

    store.dispatch(initiateAddonAbuseReportViaFirefox({ addon: fakeAddon }));
    const root = renderShallow({ store });

    expect(root.find('.ReportAbuseButton-show-more')).toHaveProp(
      'disabled',
      false,
    );
  });

  // This is a bit of a belt-and-braces approach, as the button that
  // activates this function is disabled when the textarea is empty.
  it('does not allow dispatch if there is no content in the textarea', () => {
    const fakeEvent = createFakeEvent();
    const addon = { ...fakeAddon, slug: 'this-should-not-happen' };
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const message = '';
    const root = renderShallow({ addon, store });

    root.find(DismissibleTextForm).prop('onSubmit')({
      event: fakeEvent,
      text: message,
    });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not allow dispatch if textarea is whitespace', () => {
    const fakeEvent = createFakeEvent();
    const addon = { ...fakeAddon, slug: 'this-should-not-happen' };
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const message = '      ';
    const root = renderShallow({ addon, store });

    root.find(DismissibleTextForm).prop('onSubmit')({
      event: fakeEvent,
      text: message,
    });

    sinon.assert.notCalled(dispatchSpy);
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

  it('does not dismiss when is submitting', () => {
    const addon = { ...fakeAddon, slug: 'my-addon-not-dimiss' };
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const message = 'This is abuse report';

    store.dispatch(
      sendAddonAbuseReport({
        addonSlug: addon.slug,
        errorHandlerId: errorHandler.id,
        message,
      }),
    );
    const root = renderShallow({ addon, store });

    expect(root.find(DismissibleTextForm).prop('isSubmitting')).toEqual(true);
    dispatchSpy.resetHistory();
    root.find(DismissibleTextForm).prop('onDismiss')();
    sinon.assert.notCalled(dispatchSpy);
  });
});
