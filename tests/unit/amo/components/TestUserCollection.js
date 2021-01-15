import * as React from 'react';

import { collectionName } from 'amo/reducers/collections';
import UserCollection, {
  UserCollectionBase,
} from 'amo/components/UserCollection';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import LoadingText from 'amo/components/LoadingText';

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
      authorId: 1234,
      id: 1,
      name: 'collection name',
      numberOfAddons: 5,
      slug: 'some-slug',
    };

    const root = render(props);

    expect(root.find('.UserCollection')).toHaveLength(1);
    expect(root.find('.UserCollection-link')).toHaveProp(
      'to',
      `/collections/${props.authorId}/${props.slug}/`,
    );
    expect(root.find('.UserCollection-name').children()).toHaveText(props.name);
    expect(root.find('.UserCollection-number').children()).toHaveText(
      `${props.numberOfAddons} add-ons`,
    );
  });

  it('can render a collection with a null for a name', () => {
    const props = {
      authorId: 1234,
      id: 1,
      name: null,
      numberOfAddons: 5,
      slug: 'some-slug',
    };

    const root = render(props);

    expect(root.find('.UserCollection-name').children()).toHaveText(
      collectionName({ name: null, i18n: fakeI18n() }),
    );
  });

  it('renders singular text for a collection with 1 add-on', () => {
    const props = {
      authorId: 1234,
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
