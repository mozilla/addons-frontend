/* global document, requestAnimationFrame, window
 * eslint-disable jsx-a11y/href-no-hash */

import React, { PropTypes } from 'react';
import { PhotoSwipeGallery } from 'react-photoswipe';
import 'react-photoswipe/lib/photoswipe.css';

import 'amo/css/ScreenShots.scss';

const HEIGHT = 200;
const WIDTH = 320;
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
  getThumbBoundsFn: /* istanbul ignore next */ function getThumbBoundsFn(index) {
    const thumbnail = document.querySelectorAll('.pswp-thumbnails')[index];
    if (thumbnail && thumbnail.getElementsByTagName) {
      const img = thumbnail.getElementsByTagName('img')[0];
      const pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
      const rect = img.getBoundingClientRect();
      return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
    }
    return false;
  },
};

const formatPreviews = (previews) => (
  previews.map((preview) => ({
    src: preview.image_url,
    thumbnail_src: preview.thumbnail_url,
    h: HEIGHT,
    w: WIDTH,
    title: preview.caption,
  }))
);

export const thumbnailContent = (item) => (
  <img src={item.src} className="ScreenShots-image" height={HEIGHT} width={WIDTH} alt="" />
);

export default class ScreenShots extends React.Component {
  static propTypes = {
    previews: PropTypes.array.isRequired,
  }

  onClose = (photoswipe) => {
    const index = photoswipe.getCurrentIndex();
    const list = this.viewport.querySelector('.pswp-thumbnails');
    const currentItem = list.children[index];
    const offset = currentItem.getBoundingClientRect().x;
    list.scrollLeft += offset - list.getBoundingClientRect().x;
  }

  render() {
    const { previews } = this.props;
    return (
      <div className="ScreenShots">
        <div className="ScreenShots-viewport" ref={(el) => { this.viewport = el; }}>
          <PhotoSwipeGallery
            className="ScreenShots-list" close={this.onClose} items={formatPreviews(previews)}
            options={PHOTO_SWIPE_OPTIONS} thumbnailContent={thumbnailContent} />
        </div>
      </div>
    );
  }
}
