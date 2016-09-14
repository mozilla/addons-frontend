/* eslint-disable jsx-a11y/href-no-hash */

import React, { PropTypes } from 'react';

import translate from 'core/i18n/translate';

import 'amo/css/ScreenShots.scss';


export class ScreenShotsBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;
    const totalImages = 5;

    // This is just a placeholder.
    return (
      <div className="ScreenShots">
        <img alt="" />
        <ol>
          {[...Array(totalImages)].map((x, i) =>
            (<li>
              <a href="#" className={i + 1 === 2 ? 'active' : null}>
                <span className="visually-hidden">
                  {i18n.sprintf(i18n.gettext(
                    'screenshot %(imageNumber)s of %(totalImages)s'
                  ), { imageNumber: i + 1, totalImages })}
                </span>
              </a>
            </li>)
          )}
        </ol>
      </div>
    );
  }
}

export default translate({ withRef: true })(ScreenShotsBase);
