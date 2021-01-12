/* @flow */
/* global window */
import invariant from 'invariant';
import * as React from 'react';
import { PhotoSwipeGallery } from 'react-photoswipe';
import 'react-photoswipe/lib/photoswipe.css';

import type { PreviewType } from 'amo/types/addons';
import './styles.scss';

type ThumbBounds =
  | false
  | {|
      w: number,
      x: number,
      y: number,
    |};

type GetThumbBoundsExtraParams = {|
  _document: typeof document | null,
  _window: typeof window | null,
|};

export const PHOTO_SWIPE_OPTIONS = {
  closeEl: true,
  captionEl: true,
  fullscreenEl: false,
  zoomEl: false,
  shareEl: false,
  counterEl: true,
  arrowEl: true,
  preloaderEl: true,
  // Overload getThumbBoundsFn as workaround to
  // https://github.com/minhtranite/react-photoswipe/issues/23
  getThumbBoundsFn: (
    index: number,
    {
      // $FlowFixMe: see https://github.com/facebook/flow/issues/183
      _document = typeof document !== 'undefined' ? document : null,
      _window = typeof window !== 'undefined' ? window : null,
    }: GetThumbBoundsExtraParams = {},
  ): ThumbBounds => {
    if (!_document || !_window) {
      return false;
    }

    const thumbnail = _document.querySelectorAll('.pswp-thumbnails')[index];

    if (thumbnail && thumbnail.getElementsByTagName) {
      const img = thumbnail.getElementsByTagName('img')[0];
      const pageYScroll =
        _window.pageYOffset ||
        (_document.documentElement ? _document.documentElement.scrollTop : 0);
      const rect = img.getBoundingClientRect();

      return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
    }

    return false;
  },
};

export const thumbnailContent = (item: PreviewType): React.Node => (
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
  previews: Array<PreviewType>,
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
  };

  viewport: HTMLElement | null;

  render() {
    const { previews } = this.props;

    return (
      <div className="ScreenShots">
        <div
          className="ScreenShots-viewport"
          ref={(el) => {
            this.viewport = el;
          }}
        >
          <PhotoSwipeGallery
            className="ScreenShots-list"
            close={this.onClose}
            items={previews}
            options={PHOTO_SWIPE_OPTIONS}
            thumbnailContent={thumbnailContent}
          />
        </div>
      </div>
    );
  }
}
