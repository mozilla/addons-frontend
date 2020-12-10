import { shallow, mount } from 'enzyme';
import * as React from 'react';
import { PhotoSwipeGallery } from 'react-photoswipe';

import ScreenShots, {
  PHOTO_SWIPE_OPTIONS,
  thumbnailContent,
} from 'amo/components/ScreenShots';

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
    const gallery = root.children().children();

    expect(gallery.type()).toEqual(PhotoSwipeGallery);
    expect(gallery.prop('items')).toEqual(previews);
    expect(gallery.prop('thumbnailContent')).toEqual(thumbnailContent);
  });

  it('renders custom thumbnail', () => {
    const thumbnailSrc = 'http://example.com/thumbnail.png';
    const thumbnailHeight = 123;
    const thumbnailWidth = 200;

    const item = {
      src: 'https://foo.com/img.png',
      title: 'test title',
      h: HEIGHT,
      w: WIDTH,
      thumbnail_src: thumbnailSrc,
      thumbnail_h: thumbnailHeight,
      thumbnail_w: thumbnailWidth,
    };

    const thumbnail = shallow(thumbnailContent(item));

    expect(thumbnail.type()).toEqual('img');
    expect(thumbnail.prop('src')).toEqual(thumbnailSrc);
    expect(thumbnail.prop('height')).toEqual(thumbnailHeight);
    expect(thumbnail.prop('width')).toEqual(thumbnailWidth);
    expect(thumbnail.prop('alt')).toEqual('test title');
    expect(thumbnail.prop('title')).toEqual('test title');
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

    const photoswipe = { getCurrentIndex: () => 1 };
    root.instance().onClose(photoswipe);
    // 0 += 500 - 55
    expect(list.scrollLeft).toEqual(445);
  });

  describe('PHOTO_SWIPE_OPTIONS.getThumbBoundsFn', () => {
    const { getThumbBoundsFn } = PHOTO_SWIPE_OPTIONS;

    const getFakeDocument = ({ left, top, width }) => {
      const fakeImg = {
        getBoundingClientRect: () => ({
          height: 123,
          left,
          top,
          width,
        }),
      };

      const fakeThumbnail = {
        getElementsByTagName: () => [fakeImg],
      };

      const fakeDocument = {
        querySelectorAll: () => [fakeThumbnail],
      };

      return fakeDocument;
    };

    it('returns false if thumbnail does not exist', () => {
      const bounds = getThumbBoundsFn(0);

      expect(bounds).toEqual(false);
    });

    it('returns false if _document is null', () => {
      const bounds = getThumbBoundsFn(0, { _document: null });

      expect(bounds).toEqual(false);
    });

    it('returns false if _window is null', () => {
      const bounds = getThumbBoundsFn(0, {
        _document: getFakeDocument({ left: 1, top: 2, width: 3 }),
        _window: null,
      });

      expect(bounds).toEqual(false);
    });

    it('returns an object with x, y and w values', () => {
      const left = 123;
      const top = 124;
      const width = 100;

      const fakeDocument = getFakeDocument({ left, top, width });

      const bounds = getThumbBoundsFn(0, { _document: fakeDocument });

      expect(bounds).toEqual({
        w: width,
        x: left,
        y: top,
      });
    });

    it('uses window.pageYOffset to compute `y` if available', () => {
      const left = 123;
      const top = 124;
      const width = 100;

      const fakeDocument = getFakeDocument({ left, top, width });

      const fakeWindow = {
        pageYOffset: 20,
      };

      const bounds = getThumbBoundsFn(0, {
        _document: fakeDocument,
        _window: fakeWindow,
      });

      expect(bounds).toEqual({
        w: width,
        x: left,
        y: top + fakeWindow.pageYOffset,
      });
    });

    it('uses document.documentElement.scrollTop to compute `y` if available', () => {
      const left = 123;
      const top = 124;
      const width = 100;
      const scrollTop = 30;

      const fakeDocument = getFakeDocument({ left, top, width });
      fakeDocument.documentElement = {
        scrollTop,
      };

      const bounds = getThumbBoundsFn(0, { _document: fakeDocument });

      expect(bounds).toEqual({
        w: width,
        x: left,
        y: top + scrollTop,
      });
    });
  });
});
