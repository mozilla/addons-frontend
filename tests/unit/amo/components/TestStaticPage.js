import * as React from 'react';
import { shallow } from 'enzyme';

import StaticPage from 'amo/components/StaticPage';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import Card from 'amo/components/Card';

describe(__filename, () => {
  const render = ({
    children = <div>content</div>,
    metaDescription = 'some description',
    title = 'some title',
  } = {}) => {
    return shallow(
      <StaticPage title={title} metaDescription={metaDescription}>
        {children}
      </StaticPage>,
    );
  };

  it('renders a StaticPage Component', () => {
    const title = 'Static page title';
    const metaDescription = 'Static page HeadMetaTag description';
    const children = <div>Static Page Content</div>;

    const wrapper = render({ title, metaDescription, children });

    expect(wrapper.find(HeadLinks)).toHaveLength(1);
    expect(wrapper.find(Card)).toHaveClassName('StaticPage');
    expect(wrapper.find(Card)).toHaveProp('header', title);
    expect(wrapper.find(HeadMetaTags)).toHaveProp('title', title);
    expect(wrapper.find(HeadMetaTags)).toHaveProp(
      'description',
      metaDescription,
    );
    expect(wrapper.find('.StaticPage-content').at(0)).toIncludeText(
      'Static Page Content',
    );
  });
});
