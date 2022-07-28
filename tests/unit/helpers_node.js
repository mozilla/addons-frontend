import config from 'config';

export function createUserAccountResponse({
  id = 123456,
  biography = 'I love making add-ons!',
  username = 'user-1234',
  created = '2017-08-15T12:01:13Z',
  /* eslint-disable camelcase */
  average_addon_rating = 4.3,
  display_name = null,
  fxa_edit_email_url = 'https://example.org/settings',
  is_addon_developer = false,
  is_artist = false,
  num_addons_listed = 1,
  picture_url = `https://addons.mozilla.org/static/img/zamboni/anon_user.png`,
  picture_type = '',
  homepage = null,
  permissions = [],
  occupation = null,
  location = null,
  site_status = {
    read_only: false,
    notice: null,
  },
  /* eslint-enable camelcase */
  ...otherFields
} = {}) {
  return {
    average_addon_rating,
    biography,
    created,
    display_name,
    fxa_edit_email_url,
    homepage,
    id,
    is_addon_developer,
    is_artist,
    location,
    // This is the API behavior.
    // eslint-disable-next-line camelcase
    name: display_name || username,
    num_addons_listed,
    occupation,
    picture_type,
    picture_url,
    url: null,
    username,
    permissions,
    site_status,
    ...otherFields,
  };
}

// Returns a real-ish config object with custom parameters.
//
// Example:
//
// const fakeConfig = getFakeConfig({ isDevelopment: true });
// if (fakeConfig.get('isDevelopment')) {
//   ...
// }
export const getFakeConfig = (
  params = {},
  { allowUnknownKeys = false } = {},
) => {
  for (const key of Object.keys(params)) {
    if (!config.has(key) && !allowUnknownKeys) {
      // This will help alert us when a test accidentally relies
      // on an invalid config key.
      throw new Error(
        `Cannot set a fake value for "${key}"; this key is invalid`,
      );
    }
  }
  return Object.assign(config.util.cloneDeep(config), params);
};

export const getFakeLogger = (params = {}) => {
  return {
    debug: sinon.stub(),
    error: sinon.stub(),
    info: sinon.stub(),
    warn: sinon.stub(),
    ...params,
  };
};

/*
 * Return a sample sessionId value that we use as the auth token.
 */
export function userAuthSessionId() {
  return '123456';
}
