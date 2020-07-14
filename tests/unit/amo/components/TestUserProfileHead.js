import * as React from 'react';

import HeadLinks from 'amo/components/HeadLinks';
import UserProfileHead, {
  UserProfileHeadBase,
} from 'amo/components/UserProfileHead';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import { dispatchClientMetadata, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    const allProps = {
      store: dispatchClientMetadata().store,
      ...props,
    };

    return shallowUntilTarget(
      <UserProfileHead {...allProps} />,
      UserProfileHeadBase,
    );
  };

  it('renders an HTML title', () => {
    const title = 'some user';
    const root = render({ title });

    expect(root.find('title')).toHaveLength(1);
    expect(root.find('title')).toHaveText(title);
  });

  it('renders a HeadMetaTags component', () => {
    const root = render();

    expect(root.find(HeadMetaTags)).toHaveLength(1);
  });

  it('passes its props to the HeadMetaTags component', () => {
    const description = 'some user';
    const title = 'some user';

    const root = render({ description, title });

    expect(root.find(HeadMetaTags)).toHaveProp('title', title);
    expect(root.find(HeadMetaTags)).toHaveProp('description', description);
  });

  it('renders a HeadLinks component', () => {
    const root = render();

    expect(root.find(HeadLinks)).toHaveLength(1);
  });

  it.each([
    ['no query parameters', {}, ''],
    ['other query parameters', { foo: '123' }, ''],
    ['only page_e provided', { page_e: '123' }, '?page_e=123'],
    ['only page_t provided', { page_t: '123' }, '?page_t=123'],
    ['page_t and another param', { page_t: '123', foo: 'bar' }, '?page_t=123'],
    ['page_e = 1', { page_e: '1' }, ''],
    ['page_t = 1', { page_t: '1' }, ''],
    ['page_e = 1 and page_t = 1', { page_e: '1', page_t: '1' }, ''],
    ['page_t = 1 and page_e = 1', { page_t: '1', page_e: '1' }, ''],
    ['page_e = 1 and page_t = 2', { page_e: '1', page_t: '2' }, '?page_t=2'],
    ['page_t = 1 and page_e = 2', { page_t: '1', page_e: '2' }, '?page_e=2'],
    ['page_e = 2 and page_t = 1', { page_e: '2', page_t: '1' }, '?page_e=2'],
    ['page_t = 2 and page_e = 1', { page_t: '2', page_e: '1' }, '?page_t=2'],
    ['page_e = 2 and page_t = 2', { page_e: '2', page_t: '2' }, '?page_e=2'],
    ['page_t = 2 and page_e = 2', { page_t: '2', page_e: '2' }, '?page_t=2'],
    ['page_e = 3 and page_t = 4', { page_e: '3', page_t: '4' }, '?page_t=4'],
    ['page_e = 4 and page_t = 3', { page_e: '4', page_t: '3' }, '?page_e=4'],
  ])(
    'passes a `queryString` prop to HeadMetaTags and HeadLinks with %s',
    (feature, query, expectedQueryString) => {
      const search = `?${Object.keys(query)
        .map((k) => `${k}=${query[k]}`)
        .join('&')}`;
      const { store } = dispatchClientMetadata({ search });

      const root = render({ store });

      expect(root.find(HeadMetaTags)).toHaveProp(
        'queryString',
        expectedQueryString,
      );
      expect(root.find(HeadLinks)).toHaveProp(
        'queryString',
        expectedQueryString,
      );
    },
  );
});
