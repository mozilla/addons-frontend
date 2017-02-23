import { signedInApiState as coreSignedInApiState } from '../helpers';

export const fakeAddon = Object.freeze({
  id: 1234,
  guid: '1234@my-addons.firefox',
  name: 'Chill Out',
  icon_url: 'http://olympia.dev/static/img/addon-icons/webdev-64.png',
  slug: 'chill-out',
  average_daily_users: 100,
  authors: [{
    name: 'Krupa',
    url: 'http://olympia.dev/en-US/firefox/user/krupa/',
  }],
  current_version: {
    id: 123,
    license: { name: 'tofulicense', url: 'http://license.com/' },
    version: '2.0.0',
    files: [],
  },
  previews: [],
  ratings: {
    count: 10,
    average: 3.5,
  },
  summary: 'This is a summary of the chill out add-on',
  description: 'This is a longer description of the chill out add-on',
  has_privacy_policy: true,
  homepage: 'http://hamsterdance.com/',
  type: 'extension',
});

export const fakeReview = Object.freeze({
  id: 8876,
  // The API only provides a minimal add-on representation.
  addon: {
    id: fakeAddon.id,
    slug: fakeAddon.slug,
  },
  created: '2017-01-09T21:49:14Z',
  rating: 3,
  version: fakeAddon.current_version,
  user: {
    id: 1234,
    name: 'fred',
    url: 'http://some.com/link/to/profile',
  },
  is_latest: false,
  body: 'It is Okay',
  title: 'Review Title',
});

/*
 * Redux store state for when a user has signed in.
 */
export const signedInApiState = Object.freeze({
  ...coreSignedInApiState,
  clientApp: 'firefox',
});
