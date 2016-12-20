/* global document, requestAnimationFrame, window
 * eslint-disable jsx-a11y/href-no-hash */

import React, { PropTypes } from 'react';
import { PhotoSwipeGallery } from 'react-photoswipe';
import 'react-photoswipe/lib/photoswipe.css';

import 'amo/css/ScreenShots.scss';

const HEIGHT = 200;
const WIDTH = 320;

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

  thumbnailContent = (item) => (
    <img src={item.src} className="ScreenShots-image" height={HEIGHT} width={WIDTH} alt="" />
  )

  render() {
    const { previews } = this.props;
    const items = previews.map((preview) => ({
      src: preview.image_url,
      thumbnail_src: preview.thumbnail_url,
      h: HEIGHT,
      w: WIDTH,
      title: preview.caption,
    }));
    const photoSwipeOptions = {
      closeEl: true,
      captionEl: true,
      fullscreenEl: false,
      zoomEl: false,
      shareEl: false,
      counterEl: true,
      arrowEl: true,
      preloaderEl: true,
    };
    return (
      <div className="ScreenShots">
        <div className="ScreenShots-viewport" ref={(el) => { this.viewport = el; }}>
          <PhotoSwipeGallery
            className="ScreenShots-list" close={this.onClose} items={items}
            options={photoSwipeOptions} thumbnailContent={this.thumbnailContent} />
        </div>
      </div>
    );
  }
}
