import * as React from 'react';

import UserCollection, {
  UserCollectionBase,
} from 'ui/components/UserCollection';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';

function render(customProps = {}) {
  const props = {
    i18n: fakeI18n(),
    ...customProps,
  };
  return shallowUntilTarget(<UserCollection {...props} />, UserCollectionBase);
}

describe(__filename, () => {
  it('renders a collection', () => {
    const props = {
      authorUsername: 'some-username',
      id: 1,
      name: 'collection name',
      numberOfAddons: 5,
      slug: 'some-slug',
    };

    const root = render(props);

    expect(root.find('.CollectionList-collection')).toHaveLength(1);
    expect(root.find('.CollectionList-collection-link')).toHaveProp(
      'href',
      `/collections/${props.authorUsername}/${props.slug}/`,
    );
    expect(root.find('.CollectionList-collection-name').childAt(0)).toHaveText(
      props.name,
    );
    expect(
      root.find('.CollectionList-collection-number').childAt(0),
    ).toHaveText(`${props.numberOfAddons} add-ons`);
  });

  it('renders singluar text for a collection with 1 add-on', () => {
    const props = {
      authorUsername: 'some-username',
      id: 1,
      name: 'collection name',
      numberOfAddons: 1,
      slug: 'some-slug',
    };

    const root = render(props);

    expect(
      root.find('.CollectionList-collection-number').childAt(0),
    ).toHaveText(`${props.numberOfAddons} add-on`);
  });

  it('renders loading text when no collection props are passed', () => {
    const props = {
      id: 99,
      loading: true,
    };

    const root = render(props);

    expect(root.find('.CollectionList-collection')).toHaveLength(1);
    expect(root.find('.CollectionList-collection-link')).toHaveProp(
      'href',
      '#',
    );
    expect(
      root.find('.CollectionList-collection-name').find(LoadingText),
    ).toHaveLength(1);
    expect(
      root.find('.CollectionList-collection-number').find(LoadingText),
    ).toHaveLength(1);
  });
});
