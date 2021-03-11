import { shallow, mount } from 'enzyme';
import * as React from 'react';
import { Gallery, Item } from 'react-photoswipe-gallery';

import ScreenShots, { PHOTO_SWIPE_OPTIONS } from 'amo/components/ScreenShots';

const HEIGHT = 400;
const WIDTH = 200;

describe(__filename, () => {
  const previews = [
    {
      title: 'A screenshot',
      src: 'http://img.com/one',
      thumbnail_src: 'http://img.com/1',
      thumbnail_w: WIDTH - 100,
      thumbnail_h: HEIGHT - 100,
      h: HEIGHT,
      w: WIDTH,
    },
    {
      title: 'Another screenshot',
      src: 'http://img.com/two',
      thumbnail_src: 'http://img.com/2',
      thumbnail_w: WIDTH - 100,
      thumbnail_h: HEIGHT - 100,
      h: HEIGHT,
      w: WIDTH,
    },
  ];

  it('renders the previews', () => {
    const root = shallow(<ScreenShots previews={previews} />);

    expect(root.find(Gallery)).toHaveLength(1);
    expect(root.find(Gallery)).toHaveProp('options', PHOTO_SWIPE_OPTIONS);
    expect(root.find(Item)).toHaveLength(previews.length);

    previews.forEach((preview, index) => {
      const item = root.find(Item).at(index);
      expect(item).toHaveProp('original', preview.src);
      expect(item).toHaveProp('thumbnail', preview.thumbnail_src);
      expect(item).toHaveProp('width', preview.w);
      expect(item).toHaveProp('height', preview.h);
      expect(item).toHaveProp('title', preview.title);

      const image = item.shallow();
      expect(image.type()).toEqual('img');
      expect(image).toHaveProp('src', preview.thumbnail_src);
      expect(image).toHaveProp('width', preview.thumbnail_w);
      expect(image).toHaveProp('height', preview.thumbnail_h);
      expect(image).toHaveProp('alt', preview.title);
      expect(image).toHaveProp('loading', 'lazy');
    });
  });

  it('scrolls to the active item on close', () => {
    const onePixelImage =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    const newPreviews = previews.map((preview) => ({
      ...preview,
      image_url: onePixelImage,
    }));

    const root = mount(<ScreenShots previews={newPreviews} />);
    const item = { getBoundingClientRect: () => ({ left: 500 }) };
    const list = {
      children: [null, item],
      getBoundingClientRect: () => ({ left: 55 }),
      scrollLeft: 0,
    };
    sinon.stub(root.instance().viewport, 'querySelector').returns(list);

    const fakePhotoswipe = {
      getCurrentIndex: () => 1,
      listen: (event, callback) => callback(),
    };
    root.instance().onOpenPhotoswipe(fakePhotoswipe);
    // 0 += 500 - 55
    expect(list.scrollLeft).toEqual(445);
  });
});
