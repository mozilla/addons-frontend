export const fakeAddon = {
  id: 1234,
  guid: '1234@my-addons.firefox',
  name: 'Chill Out',
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
  },
  previews: [],
  summary: 'This is a summary of the chill out add-on',
  description: 'This is a longer description of the chill out add-on',
  has_privacy_policy: true,
  homepage: 'http://hamsterdance.com/',
  type: 'extension',
};

export const fakeReview = {
  id: 8876,
  // The API only provides a minimal add-on representation.
  addon: {
    id: fakeAddon.id,
    slug: fakeAddon.slug,
  },
  rating: 3,
  version: fakeAddon.current_version,
  user: {
    id: 1234,
  },
  is_latest: false,
  body: 'It is Okay',
  title: null,
};

/*
 * Redux store state for when a user has signed in.
 */
export const signedInApiState = {
  lang: 'en-US',
  clientApp: 'firefox',
  token: 'secret-token',
};
