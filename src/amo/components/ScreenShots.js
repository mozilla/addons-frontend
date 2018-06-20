/* @flow */
/* global document, window */
/* eslint-disable jsx-a11y/href-no-hash */
import invariant from 'invariant';
import * as React from 'react';
import { PhotoSwipeGallery } from 'react-photoswipe';
import 'react-photoswipe/lib/photoswipe.css';

import 'amo/css/ScreenShots.scss';

const PHOTO_SWIPE_OPTIONS = {
  closeEl: true,
  captionEl: true,
  fullscreenEl: false,
  zoomEl: false,
  shareEl: false,
  counterEl: true,
  arrowEl: true,
  preloaderEl: true,
  // Overload getThumbsBoundsFn as workaround to
  // https://github.com/minhtranite/react-photoswipe/issues/23
  getThumbBoundsFn: function getThumbBoundsFn(index) {
    const thumbnail = document.querySelectorAll('.pswp-thumbnails')[index];

    if (thumbnail && thumbnail.getElementsByTagName) {
      const img = thumbnail.getElementsByTagName('img')[0];
      const pageYScroll = window.pageYOffset || (
        document.documentElement ? document.documentElement.scrollTop : 0
      );
      const rect = img.getBoundingClientRect();

      return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
    }

    return false;
  },
};

type ExternalPreview = {|
  caption: string,
  image_size: [number, number],
  image_url: string,
  thumbnail_size: [number, number],
  thumbnail_url: string,
|};

type Preview = {|
  h: number,
  src: string,
  thumbnail_h: number,
  thumbnail_src: string,
  thumbnail_w: number,
  title: string,
  w: number,
|};

const formatPreviews = (previews: Array<ExternalPreview>): Array<Preview> => (
  previews.map((preview) => ({
    h: preview.image_size[1],
    src: preview.image_url,
    thumbnail_h: preview.thumbnail_size[1],
    thumbnail_src: preview.thumbnail_url,
    thumbnail_w: preview.thumbnail_size[0],
    title: preview.caption,
    w: preview.image_size[0],
  }))
);

export const thumbnailContent = (item: Preview): React.Node => (
  <img
    alt={item.title}
    className="ScreenShots-image"
    height={item.thumbnail_h}
    src={item.thumbnail_src}
    title={item.title}
    width={item.thumbnail_w}
  />
);

type Props = {|
  previews: Array<ExternalPreview>,
|};

export default class ScreenShots extends React.Component<Props> {
  onClose = (photoswipe: Object) => {
    const index = photoswipe.getCurrentIndex();

    invariant(this.viewport, 'viewport ref is required');

    const list = this.viewport.querySelector('.pswp-thumbnails');

    invariant(list, 'list is required');

    const currentItem = list.children[index];
    const offset = currentItem.getBoundingClientRect().left;
    list.scrollLeft += offset - list.getBoundingClientRect().left;
  }

  viewport: HTMLElement | null;

  render() {
    const { previews } = this.props;

    return (
      <div className="ScreenShots">
        <div
          className="ScreenShots-viewport"
          ref={(el) => { this.viewport = el; }}
        >
          <PhotoSwipeGallery
            className="ScreenShots-list"
            close={this.onClose}
            items={formatPreviews(previews)}
            options={PHOTO_SWIPE_OPTIONS}
            thumbnailContent={thumbnailContent}
          />
        </div>
      </div>
    );
  }
}
