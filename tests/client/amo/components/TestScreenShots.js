import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { PhotoSwipeGallery } from 'react-photoswipe';

import ScreenShots, { thumbnailContent } from 'amo/components/ScreenShots';
import { shallowRender } from 'tests/client/helpers';

describe('<ScreenShots />', () => {
  const previews = [
    {
      caption: 'A screenshot',
      image_url: 'http://img.com/one',
      thumbnail_url: 'http://img.com/1',
    },
    {
      caption: 'Another screenshot',
      image_url: 'http://img.com/two',
      thumbnail_url: 'http://img.com/2',
    },
  ];

  it('renders the previews', () => {
    const items = [
      {
        title: 'A screenshot',
        src: 'http://img.com/one',
        thumbnail_src: 'http://img.com/1',
        h: 200,
        w: 320,
      },
      {
        title: 'Another screenshot',
        src: 'http://img.com/two',
        thumbnail_src: 'http://img.com/2',
        h: 200,
        w: 320,
      },
    ];
    const root = shallowRender(<ScreenShots previews={previews} />);
    const gallery = root.props.children.props.children;
    assert.equal(gallery.type, PhotoSwipeGallery);
    assert.deepEqual(gallery.props.items, items);
    assert.deepEqual(gallery.props.thumbnailContent, thumbnailContent);
  });

  it('renders custom thumbnail', () => {
    const item = { src: 'https://foo.com/img.png' };
    const thumbnail = thumbnailContent(item);
    assert.equal(thumbnail.type, 'img');
    assert.equal(thumbnail.props.src, 'https://foo.com/img.png');
    assert.equal(thumbnail.props.height, '200');
    assert.equal(thumbnail.props.width, '320');
    assert.equal(thumbnail.props.alt, '');
  });

  it('scrolls to the active item on close', () => {
    const onePixelImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    const newPreviews = previews.map((preview) => ({ ...preview, image_url: onePixelImage }));
    const root = renderIntoDocument(<ScreenShots previews={newPreviews} />);
    const item = { getBoundingClientRect: () => ({ x: 500 }) };
    const list = {
      children: [null, item],
      getBoundingClientRect: () => ({ x: 55 }),
      scrollLeft: 0,
    };
    sinon.stub(root.viewport, 'querySelector').returns(list);
    const photoswipe = { getCurrentIndex: () => 1 };
    root.onClose(photoswipe);
    // 0 += 500 - 55
    assert.equal(list.scrollLeft, 445);
  });
});
