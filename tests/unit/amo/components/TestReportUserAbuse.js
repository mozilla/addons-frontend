import * as React from 'react';

import ReportUserAbuse, {
  ReportUserAbuseBase,
} from 'amo/components/ReportUserAbuse';
import { setError } from 'core/actions/errors';
import {
  hideUserAbuseReportUI,
  loadUserAbuseReport,
  sendUserAbuseReport,
  showUserAbuseReportUI,
} from 'amo/reducers/userAbuseReports';
import ErrorList from 'ui/components/ErrorList';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFakeUserAbuseReport,
  createStubErrorHandler,
  createUserAccountResponse,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';


describe(__filename, () => {
  const defaultRenderProps = {
    errorHandler: createStubErrorHandler(),
    i18n: fakeI18n(),
    store: dispatchClientMetadata().store,
    user: createUserAccountResponse({ id: 9 }),
  };

  function renderShallow({ ...props } = {}) {
    return shallowUntilTarget(
      <ReportUserAbuse {...defaultRenderProps} {...props} />,
      ReportUserAbuseBase
    );
  }

  it('renders nothing if no user exists', () => {
    const root = renderShallow({ user: null });

    expect(root.find('.ReportUserAbuse')).toHaveLength(0);
  });

  it('renders a button to report an user', () => {
    const root = renderShallow();

    expect(root.find('.ReportUserAbuse')).toHaveLength(1);
    expect(root.find('.ReportUserAbuse-show-more').prop('children'))
      .toEqual('Report this user for abuse');
  });

  it('shows the preview content when first rendered', () => {
    const root = renderShallow();

    expect(root.find('.ReportUserAbuse--is-expanded')).toHaveLength(0);
  });

  it('shows more content when showReportUI is called', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const user = createUserAccountResponse();
    const root = renderShallow({ store, user });

    root.instance().showReportUI();

    sinon.assert.calledWith(dispatchSpy, showUserAbuseReportUI({ user }));
  });

  it('hides more content when hideReportUI is called', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const user = createUserAccountResponse();
    const root = renderShallow({ store, user });

    root.instance().showReportUI();
    dispatchSpy.reset();

    root.instance().hideReportUI();

    sinon.assert.calledWith(dispatchSpy, hideUserAbuseReportUI({ user }));
  });

  it('dispatches the send abuse report action', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const user = createUserAccountResponse();
    const root = renderShallow({ store, user });

    root.instance().sendReport({ text: 'This user is funny' });

    sinon.assert.calledWith(dispatchSpy, sendUserAbuseReport({
      errorHandlerId: root.instance().props.errorHandler.id,
      message: 'This user is funny',
      user,
    }));
  });

  it('shows a success message and hides the button if report was sent', () => {
    const user = createUserAccountResponse();
    const { store } = dispatchClientMetadata();
    const abuseResponse = createFakeUserAbuseReport({
      message: 'Seriously, where is my money?!',
      user,
    });
    store.dispatch(loadUserAbuseReport(abuseResponse));
    const root = renderShallow({ store, user });

    expect(root.find('.ReportUserAbuse--report-sent')).toHaveLength(1);
    expect(root.find('.ReportUserAbuse-form')).toHaveLength(0);
    expect(root.find('.ReportUserAbuse-show-more')).toHaveLength(0);
    expect(root.find('button.ReportUserAbuse-send-report')).toHaveLength(0);
  });

  it('renders an error if one exists', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();
    store.dispatch(setError({
      error: new Error('something bad'),
      id: errorHandler.id,
    }));
    const root = renderShallow({ errorHandler, store });

    expect(root.find(ErrorList)).toHaveLength(1);
  });
});
