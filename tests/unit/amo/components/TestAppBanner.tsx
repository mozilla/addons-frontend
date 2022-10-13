import * as React from 'react';

import AppBanner from 'amo/components/AppBanner';
import { logOutUser } from 'amo/reducers/users';
import { loadSiteStatus } from 'amo/reducers/site';
import { dispatchClientMetadata, dispatchSignInActions, render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (props = {}) => {
    return defaultRender(<AppBanner {...props} />, {
      store,
    });
  };

  it('allows for a custom className', () => {
    const className = 'some-custom-className';
    render({
      className,
    });
    expect(screen.getByClassName('AppBanner')).toHaveClass(className);
  });
  describe('Tests for SiteNotices', () => {
    it('renders nothing by default', () => {
      render();
      expect(screen.queryByClassName('Notice')).not.toBeInTheDocument();
    });
    it('renders a site notice', () => {
      const notice = 'site is kaput';
      store.dispatch(loadSiteStatus({
        readOnly: false,
        notice,
      }));
      render();
      expect(screen.getByText(notice)).toBeInTheDocument();
    });
    it('renders a site notice with HTML tags', () => {
      const href = 'https://example.org';
      const linkText = 'here';
      const notice = `more info <a href="${href}">${linkText}</a>`;
      store.dispatch(loadSiteStatus({
        readOnly: false,
        notice,
      }));
      render();
      expect(screen.getByRole('link', {
        name: linkText,
      })).toHaveAttribute('href', href);
    });
    it('renders nothing when the site is not in read only mode and there is no site notice configured', () => {
      store.dispatch(loadSiteStatus({
        readOnly: false,
        notice: null,
      }));
      render();
      expect(screen.queryByClassName('Notice')).not.toBeInTheDocument();
    });
    it('renders a notice when the site is in read only mode', () => {
      store.dispatch(loadSiteStatus({
        readOnly: true,
        notice: null,
      }));
      render();
      expect(screen.getByText(/Some features are temporarily disabled/)).toBeInTheDocument();
    });
    it('renders two notices when the site is in read only mode and there is a site notice configured', () => {
      const notice = 'site is kaput';
      store.dispatch(loadSiteStatus({
        readOnly: true,
        notice,
      }));
      render();
      expect(screen.getByText(notice)).toBeInTheDocument();
      expect(screen.getByText(/Some features are temporarily disabled/)).toBeInTheDocument();
    });
    it('does not render the "logged out" notice when user is logged in', () => {
      store = dispatchSignInActions().store;
      render();
      expect(screen.queryByText('You have been logged out.')).not.toBeInTheDocument();
    });
    it('renders a notice when user has been logged out', () => {
      store = dispatchSignInActions().store;
      store.dispatch(logOutUser());
      render();
      expect(screen.getByText('You have been logged out.')).toBeInTheDocument();
    });
  });
});