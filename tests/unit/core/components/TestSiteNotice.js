import * as React from 'react';

import SiteNotice, { SiteNoticeBase } from 'core/components/SiteNotice';
import { loadSiteStatus } from 'core/reducers/site';
import Notice from 'ui/components/Notice';
import {
  dispatchClientMetadata,
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

    return shallowUntilTarget(<SiteNotice {...props} />, SiteNoticeBase);
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
    expect(root.find(Notice)).toHaveProp('children', notice);
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
});
