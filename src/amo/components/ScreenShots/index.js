/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { Gallery, Item } from 'react-photoswipe-gallery';
import 'photoswipe/dist/photoswipe.css';

import type { PreviewType } from 'amo/types/addons';
import './styles.scss';

export const PHOTO_SWIPE_OPTIONS = {
  bgOpacity: 0.9,
};

type Props = {|
  previews: Array<PreviewType>,
|};

export default class ScreenShots extends React.Component<Props> {
  viewport: HTMLElement | null;

  onOpenPhotoswipe: (photoswipe: Object) => void = (photoswipe: Object) => {
    invariant(this.viewport, 'viewport ref is required');

    const list = this.viewport.querySelector('.ScreenShots-list');
    invariant(list, 'list is required');

    // This is used to update the horizontal list of thumbnails in order to
    // show the last image displayed in fullscreen mode when we close the
    // carousel.
    photoswipe.on('close', () => {
      const { index } = photoswipe.currSlide;
      const currentItem = list.children[index];
      const offset = currentItem.getBoundingClientRect().left;

      list.scrollLeft += offset - list.getBoundingClientRect().left;
    });
  };

  render(): React.Node {
    const { previews } = this.props;

    return (
      <div className="ScreenShots">
        <div
          className="ScreenShots-viewport"
          ref={(el) => {
            this.viewport = el;
          }}
        >
          <div className="ScreenShots-list">
            <Gallery
              options={PHOTO_SWIPE_OPTIONS}
              onOpen={this.onOpenPhotoswipe}
              withCaption
            >
              {previews.map((preview) => (
                <Item
                  key={preview.src}
                  original={preview.src}
                  thumbnail={preview.thumbnail_src}
                  width={preview.w}
                  height={preview.h}
                  caption={preview.title}
                >
                  {({ ref, open }) => (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
                    <img
                      alt={preview.title}
                      className="ScreenShots-image"
                      ref={ref}
                      onClick={open}
                      src={preview.thumbnail_src}
                      width={preview.thumbnail_w}
                      height={preview.thumbnail_h}
                    />
                  )}
                </Item>
              ))}
            </Gallery>
          </div>
        </div>
      </div>
    );
  }
}
