export const fakeAddon = {
  id: 1234,
  name: 'Chill Out',
  slug: 'chill-out',
  authors: [{
    name: 'Krupa',
    url: 'http://olympia.dev/en-US/firefox/user/krupa/',
  }],
  current_version: { id: 123, version: '2.0.0' },
  summary: 'This is a summary of the chill out add-on',
  description: 'This is a longer description of the chill out add-on',
};

/*
 * Return a realistic API response to any call that creates an add-on rating.
 */
export function createRatingResponse(customProps = {}) {
  return {
    id: 123,
    user: { name: 'the_username' },
    rating: 5,
    version: {
      id: 54371,
      version: '1.0.1',
    },
    body: null,
    title: null,
    ...customProps,
  };
}

/*
 * Redux store state for when a user has signed in.
 */
export const signedInApiState = {
  lang: 'en-US',
  token: 'secret-token',
};
