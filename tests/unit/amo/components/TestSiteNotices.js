import * as React from 'react';

import SiteNotices, { SiteNoticesBase } from 'amo/components/SiteNotices';
import { logOutUser } from 'amo/reducers/users';
import { loadSiteStatus } from 'amo/reducers/site';
import Notice from 'ui/components/Notice';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({
    store = dispatchClientMetadata().store,
    ...customProps
  } = {}) => {
    const props = {
      i18n: fakeI18n(),
      store,
      ...customProps,
    };

    return shallowUntilTarget(<SiteNotices {...props} />, SiteNoticesBase);
  };

  it('renders nothing by default', () => {
    const root = render();

    expect(root.find(Notice)).toHaveLength(0);
  });

  it('renders a site notice', () => {
    const notice = 'site is kaput';
    const { store } = dispatchClientMetadata();
    store.dispatch(loadSiteStatus({ readOnly: false, notice }));

    const root = render({ store });

    expect(root.find(Notice)).toHaveLength(1);
    expect(root.find(Notice)).toHaveProp('id', 'amo-site-notice');
    expect(root.find(Notice).find('span').html()).toContain(notice);
  });

  it('renders a site notice with HTML tags', () => {
    const notice = 'more info <a href="https://example.org">here</a>';
    const { store } = dispatchClientMetadata();
    store.dispatch(loadSiteStatus({ readOnly: false, notice }));

    const root = render({ store });

    expect(root.find(Notice).find('span').html()).toContain(notice);
  });

  it('renders nothing when the site is not in read only mode and there is no site notice configured', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadSiteStatus({ readOnly: false, notice: null }));

    const root = render({ store });

    expect(root.find(Notice)).toHaveLength(0);
  });

  it('renders a notice when the site is in read only mode', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadSiteStatus({ readOnly: true, notice: null }));

    const root = render({ store });

    expect(root.find(Notice)).toHaveLength(1);
    expect(root.find(Notice)).toHaveProp('id', 'amo-site-read-only');
    expect(root.find(Notice)).toHaveProp(
      'children',
      expect.stringMatching('Some features are temporarily'),
    );
  });

  it('renders two notices when the site is in read only mode and there is a site notice configured', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadSiteStatus({ readOnly: true, notice: 'notice' }));

    const root = render({ store });

    expect(root.find(Notice)).toHaveLength(2);
  });

  it('does not render the "logged out" notice when user is logged in', () => {
    const { store } = dispatchSignInActions();

    const root = render({ store });

    expect(root.find(Notice)).toHaveLength(0);
  });

  it('renders a notice when user has been logged out', () => {
    const { store } = dispatchSignInActions();
    store.dispatch(logOutUser());

    const root = render({ store });

    expect(root.find(Notice)).toHaveLength(1);
    expect(root.find(Notice)).toHaveProp('id', 'user-was-logged-out');
  });
});
