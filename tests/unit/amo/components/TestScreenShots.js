import { shallow, mount } from 'enzyme';
import * as React from 'react';
import { PhotoSwipeGallery } from 'react-photoswipe';

import ScreenShots, {
  thumbnailContent,
} from 'amo/components/ScreenShots';

const HEIGHT = 400;
const WIDTH = 200;

describe(__filename, () => {
  const previews = [
    {
      caption: 'A screenshot',
      image_url: 'http://img.com/one',
      thumbnail_url: 'http://img.com/1',
      image_size: [WIDTH, HEIGHT],
      thumbnail_size: [WIDTH, HEIGHT],
    },
    {
      caption: 'Another screenshot',
      image_url: 'http://img.com/two',
      thumbnail_url: 'http://img.com/2',
      image_size: [WIDTH, HEIGHT],
      thumbnail_size: [WIDTH, HEIGHT],
    },
  ];

  it('renders the previews', () => {
    const items = [
      {
        title: 'A screenshot',
        src: 'http://img.com/one',
        thumbnail_src: 'http://img.com/1',
        h: HEIGHT,
        w: WIDTH,
      },
      {
        title: 'Another screenshot',
        src: 'http://img.com/two',
        thumbnail_src: 'http://img.com/2',
        h: HEIGHT,
        w: WIDTH,
      },
    ];
    const root = shallow(<ScreenShots previews={previews} />);
    const gallery = root.children().children();

    expect(gallery.type()).toEqual(PhotoSwipeGallery);
    expect(gallery.prop('items')).toEqual(items);
    expect(gallery.prop('thumbnailContent')).toEqual(thumbnailContent);
  });

  it('renders custom thumbnail', () => {
    const item = { src: 'https://foo.com/img.png', title: 'test title', h: 123, w: 1234 };
    const thumbnail = shallow(thumbnailContent(item));

    expect(thumbnail.type()).toEqual('img');
    expect(thumbnail.prop('src')).toEqual('https://foo.com/img.png');
    expect(thumbnail.prop('height')).toEqual(123);
    expect(thumbnail.prop('width')).toEqual(1234);
    expect(thumbnail.prop('alt')).toEqual('test title');
    expect(thumbnail.prop('title')).toEqual('test title');
  });

  it('scrolls to the active item on close', () => {
    const onePixelImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    const newPreviews = previews.map((preview) => (
      { ...preview, image_url: onePixelImage }
    ));

    const root = mount(<ScreenShots previews={newPreviews} />);
    const item = { getBoundingClientRect: () => ({ x: 500 }) };
    const list = {
      children: [null, item],
      getBoundingClientRect: () => ({ x: 55 }),
      scrollLeft: 0,
    };
    sinon.stub(root.instance().viewport, 'querySelector').returns(list);
    const photoswipe = { getCurrentIndex: () => 1 };
    root.instance().onClose(photoswipe);
    // 0 += 500 - 55
    expect(list.scrollLeft).toEqual(445);
  });
});
