import * as React from 'react';

import UserCollection, {
  UserCollectionBase,
} from 'ui/components/UserCollection';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';

describe(__filename, () => {
  function render(customProps = {}) {
    const props = {
      i18n: fakeI18n(),
      ...customProps,
    };
    return shallowUntilTarget(
      <UserCollection {...props} />,
      UserCollectionBase,
    );
  }

  it('renders a collection', () => {
    const props = {
      authorUsername: 'some-username',
      id: 1,
      name: 'collection name',
      numberOfAddons: 5,
      slug: 'some-slug',
    };

    const root = render(props);

    expect(root.find('.UserCollection')).toHaveLength(1);
    expect(root.find('.UserCollection-link')).toHaveProp(
      'to',
      `/collections/${props.authorUsername}/${props.slug}/`,
    );
    expect(root.find('.UserCollection-name').children()).toHaveText(props.name);
    expect(root.find('.UserCollection-number').children()).toHaveText(
      `${props.numberOfAddons} add-ons`,
    );
  });

  it('renders singular text for a collection with 1 add-on', () => {
    const props = {
      authorUsername: 'some-username',
      id: 1,
      name: 'collection name',
      numberOfAddons: 1,
      slug: 'some-slug',
    };

    const root = render(props);

    expect(root.find('.UserCollection-number').children()).toHaveText(
      `${props.numberOfAddons} add-on`,
    );
  });

  it('renders loading text when loading is true', () => {
    const props = {
      id: 99,
      loading: true,
    };

    const root = render(props);

    expect(root.find('.UserCollection')).toHaveLength(1);
    expect(root.find('.UserCollection-link')).toHaveProp('href', '');
    expect(root.find('.UserCollection-name').find(LoadingText)).toHaveLength(1);
    expect(root.find('.UserCollection-number').find(LoadingText)).toHaveLength(
      1,
    );
  });
});
