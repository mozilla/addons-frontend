import * as React from 'react';

import UserProfile, { UserProfileBase } from 'amo/components/UserProfile';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ReportAbuseButton from 'amo/components/ReportAbuseButton';
import UserAvatar from 'amo/components/UserAvatar';
import { fetchUserAccount, getCurrentUser } from 'amo/reducers/users';
import { ErrorHandler } from 'core/errorHandler';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';


describe(__filename, () => {
  function renderUserProfile({
    i18n = fakeI18n(),
    params = { username: 'tofumatt' },
    store = dispatchSignInActions({
      display_name: 'Matt MacTofu',
      userId: 500,
      username: 'tofumatt',
    }).store,
    ...props
  // eslint-disable-next-line padded-blocks
  } = {}) {

    return shallowUntilTarget(
      <UserProfile i18n={i18n} params={params} store={store} {...props} />,
      UserProfileBase,
    );
  }

  it('renders user profile page', () => {
    const root = renderUserProfile();

    expect(root.find('.UserProfile')).toHaveLength(1);
  });

  it('dispatches fetchUserAccount action if username is not found', () => {
    const { store } = dispatchSignInActions();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const username = 'i-am-not-in-the-store';

    const root = renderUserProfile({ params: { username }, store });

    sinon.assert.calledWith(dispatchSpy, fetchUserAccount({
      errorHandlerId: root.instance().props.errorHandler.id,
      username,
    }));
  });

  it('dispatches fetchUserAccount action if username param changes', () => {
    const { store } = dispatchSignInActions({ username: 'black-panther' });
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = renderUserProfile({
      params: { username: 'black-panther' },
      store,
    });

    sinon.assert.notCalled(dispatchSpy);

    root.setProps({ params: { username: 'killmonger' } });

    sinon.assert.calledWith(dispatchSpy, fetchUserAccount({
      errorHandlerId: root.instance().props.errorHandler.id,
      username: 'killmonger',
    }));
  });

  it('does not dispatch fetchUserAccount if username does not change', () => {
    const { store } = dispatchSignInActions({ username: 'black-panther' });
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = renderUserProfile({
      params: { username: 'black-panther' },
      store,
    });

    sinon.assert.notCalled(dispatchSpy);

    root.setProps({ params: { username: 'black-panther' } });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('renders the user avatar', () => {
    const root = renderUserProfile();

    expect(root.find('.UserProfile-user-info').shallow().find(UserAvatar))
      .toHaveProp(
        'user',
        getCurrentUser(root.instance().props.store.getState().users)
      );
  });

  it('renders a placeholder avatar while user is loading', () => {
    const root = renderUserProfile({ params: { username: 'not-ready' } });

    expect(
      root.find('.UserProfile-user-info').shallow().find(UserAvatar)
    ).toHaveProp('user', undefined);
  });

  it("renders the user's name", () => {
    const root = renderUserProfile();

    expect(
      root.find('.UserProfile-user-info').shallow().find('.UserProfile-name')
    ).toHaveText('Matt MacTofu');
  });

  it('renders LoadingText when user name is not ready', () => {
    const root = renderUserProfile({ params: { username: 'not-ready' } });

    expect(
      root
        .find('.UserProfile-user-info')
        .shallow()
        .find('.UserProfile-name')
        .find(LoadingText)
    ).toHaveLength(1);
  });

  it("renders the user's username if no display name exists", () => {
    const { store } = dispatchSignInActions({
      userId: 500,
      username: 'tofumatt',
    });
    const root = renderUserProfile({ store });

    expect(
      root.find('.UserProfile-user-info').shallow().find('.UserProfile-name')
    ).toHaveText('tofumatt');
  });

  it("renders the user's homepage", () => {
    const { store } = dispatchSignInActions({
      homepage: 'http://hamsterdance.com/',
      username: 'tofumatt',
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-homepage')).toHaveLength(1);
    expect(root.find('.UserProfile-homepage').children())
      .toHaveText('hamsterdance.com/');
  });

  it("omits homepage if the user doesn't have one set", () => {
    const { store } = dispatchSignInActions({
      homepage: null,
      username: 'tofumatt',
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-homepage')).toHaveLength(0);
  });

  it("renders the user's account creation date", () => {
    const { store } = dispatchSignInActions({
      created: '2000-08-15T12:01:13Z',
      username: 'tofumatt',
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-user-since')).toHaveLength(1);
    expect(root.find('.UserProfile-user-since').children())
      .toHaveText('Aug 15, 2000');
  });

  it('renders LoadingText for account creation date while loading', () => {
    const root = renderUserProfile({ params: { username: 'not-tofu' } });

    expect(root.find('.UserProfile-user-since')).toHaveLength(1);
    expect(root.find('.UserProfile-user-since').find(LoadingText))
      .toHaveLength(1);
  });

  it("renders the user's number of add-ons", () => {
    const { store } = dispatchSignInActions({
      num_addons_listed: 70,
      username: 'tofumatt',
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-number-of-addons')).toHaveLength(1);
    expect(root.find('.UserProfile-number-of-addons').children())
      .toHaveText('70');
  });

  it('renders LoadingText for number of add-ons while loading', () => {
    const root = renderUserProfile({ params: { username: 'not-tofu' } });

    expect(root.find('.UserProfile-number-of-addons')).toHaveLength(1);
    expect(root.find('.UserProfile-number-of-addons').find(LoadingText))
      .toHaveLength(1);
  });

  it("renders the user's average add-on rating", () => {
    const { store } = dispatchSignInActions({
      average_addon_rating: 4.1,
      username: 'tofumatt',
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-rating-average')).toHaveLength(1);
    expect(root.find('.UserProfile-rating-average').find(Rating))
      .toHaveProp('rating', 4.1);
  });

  it('renders LoadingText for average add-on rating while loading', () => {
    const root = renderUserProfile({ params: { username: 'not-tofu' } });

    expect(root.find('.UserProfile-rating-average')).toHaveLength(1);
    expect(root.find('.UserProfile-rating-average').find(LoadingText))
      .toHaveLength(1);
  });

  it("renders the user's biography", () => {
    const { store } = dispatchSignInActions({
      biography: 'Not even vegan!',
      username: 'tofumatt',
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-biography').render().html())
      .toContain('Not even vegan!');
  });

  it('omits a null biography', () => {
    const { store } = dispatchSignInActions({
      biography: null,
      username: 'tofumatt',
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-biography')).toHaveLength(0);
  });

  it('omits an empty biography', () => {
    const { store } = dispatchSignInActions({
      biography: '',
      username: 'tofumatt',
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-biography')).toHaveLength(0);
  });

  it('renders a report abuse button if user is loaded', () => {
    const root = renderUserProfile();

    expect(root.find(ReportAbuseButton)).toHaveLength(1);
  });

  it('renders no report abuse button if user is not loaded', () => {
    const root = renderUserProfile({ params: { username: 'not-loaded' } });

    expect(root.find(ReportAbuseButton)).toHaveLength(0);
  });

  it('renders a not found page if the API request is a 404', () => {
    const { store } = dispatchSignInActions();
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      capturedError: { responseStatusCode: 404 },
      dispatch: store.dispatch,
    });

    const root = renderUserProfile({ errorHandler, store });

    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('renders errors', () => {
    const { store } = dispatchSignInActions();
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('unexpected error'));

    const root = renderUserProfile({ errorHandler, store });

    expect(root.find(ErrorList)).toHaveLength(1);
  });
});
