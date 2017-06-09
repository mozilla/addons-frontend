import { shallow } from 'enzyme';
import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { PhotoSwipeGallery } from 'react-photoswipe';

import ScreenShots, { thumbnailContent } from 'amo/components/ScreenShots';

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
    const root = shallow(<ScreenShots previews={previews} />);
    const gallery = root.children().children();

    expect(gallery.type()).toEqual(PhotoSwipeGallery);
    expect(gallery.prop('items')).toEqual(items);
    expect(gallery.prop('thumbnailContent')).toEqual(thumbnailContent);
  });

  it('renders custom thumbnail', () => {
    const item = { src: 'https://foo.com/img.png' };
    const thumbnail = shallow(thumbnailContent(item));

    expect(thumbnail.type()).toEqual('img');
    expect(thumbnail.prop('src')).toEqual('https://foo.com/img.png');
    expect(thumbnail.prop('height')).toEqual(200);
    expect(thumbnail.prop('width')).toEqual(320);
    expect(thumbnail.prop('alt')).toEqual('');
  });

  it('scrolls to the active item on close', () => {
    const onePixelImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    const newPreviews = previews.map((preview) => (
      { ...preview, image_url: onePixelImage }
    ));
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
    expect(list.scrollLeft).toEqual(445);
  });
});
