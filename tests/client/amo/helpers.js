/* eslint-disable import/prefer-default-export */
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
    version: fakeAddon.current_version,
    body: null,
    title: null,
    ...customProps,
  };
}
