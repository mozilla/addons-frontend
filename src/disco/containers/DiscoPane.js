/* eslint-disable max-len */
/* global navigator */
import React from 'react';
import PropTypes from 'prop-types';
import { camelizeKeys as camelCaseKeys } from 'humps';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';

import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import tracking from 'core/tracking';
import { INSTALL_STATE } from 'core/constants';
import InfoDialog from 'core/containers/InfoDialog';
import { addChangeListeners } from 'core/addonManager';
import { getAddonByGUID } from 'core/reducers/addons';
import {
  NAVIGATION_CATEGORY,
  VIDEO_CATEGORY,
} from 'disco/constants';
import { getDiscoResults } from 'disco/actions';
import Addon from 'disco/components/Addon';
import videoPoster from 'disco/img/AddOnsPoster.jpg';
import videoMp4 from 'disco/video/AddOns.mp4';
import videoWebm from 'disco/video/AddOns.webm';


export class DiscoPaneBase extends React.Component {
  static propTypes = {
    AddonComponent: PropTypes.func,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    handleGlobalEvent: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    mozAddonManager: PropTypes.object,
    params: {
      platform: PropTypes.string.isRequired,
    },
    results: PropTypes.arrayOf(PropTypes.object).isRequired,
    _addChangeListeners: PropTypes.func,
    _tracking: PropTypes.object,
    _video: PropTypes.object,
  }

  static defaultProps = {
    AddonComponent: Addon,
    mozAddonManager: config.get('server') ? {} : navigator.mozAddonManager,
    _addChangeListeners: addChangeListeners,
    _tracking: tracking,
    _video: null,
  }

  constructor(props) {
    super(props);
    this.state = { showVideo: false };

    const {
      dispatch,
      errorHandler,
      location,
      params,
      results,
    } = props;
    // TODO: fix this; it's not the right way to detect whether a
    // dispatch is needed. This should look for an undefined value
    // instead of an empty list because an empty list could be a valid
    // (yet unlikley) API response.
    if (!errorHandler.hasError() && !results.length) {
      // We accept all query params here and filter them out based on the
      // `taarParamsToUse` config value. See:
      // https://github.com/mozilla/addons-frontend/issues/4155
      const taarParams = { ...location.query, platform: params.platform };

      dispatch(getDiscoResults({
        errorHandlerId: errorHandler.id,
        taarParams,
      }));
    }
  }

  componentDidMount() {
    const { _addChangeListeners, handleGlobalEvent, mozAddonManager } = this.props;
    // Use addonManager.addChangeListener to setup and filter events.
    _addChangeListeners(handleGlobalEvent, mozAddonManager);
  }

  showVideo = (e) => {
    const { _tracking } = this.props;
    const _video = this.props._video || this.video;

    e.preventDefault();
    this.setState({ showVideo: true });
    _video.play();
    _tracking.sendEvent({
      action: 'play',
      category: VIDEO_CATEGORY,
    });
  }

  closeVideo = (e) => {
    const { _tracking } = this.props;
    const _video = this.props._video || this.video;

    e.preventDefault();
    this.setState({ showVideo: false });
    _video.pause();
    _tracking.sendEvent({
      action: 'close',
      category: VIDEO_CATEGORY,
    });
  }

  showMoreAddons = () => {
    const { _tracking } = this.props;
    _tracking.sendEvent({
      action: 'click',
      category: NAVIGATION_CATEGORY,
      label: 'See More Add-ons',
    });
  }

  render() {
    // TODO: Add captions see https://github.com/mozilla/addons/issues/367
    /* eslint-disable jsx-a11y/media-has-caption */

    const { AddonComponent, errorHandler, results, i18n } = this.props;
    const { showVideo } = this.state;

    return (
      <div id="app-view" ref={(ref) => { this.container = ref; }}>
        {errorHandler.renderErrorIfPresent()}
        <header className={showVideo ? 'show-video' : ''}>
          <div className="disco-header">
            <div className="disco-content">
              <h1>{i18n.gettext('Personalize Your Firefox')}</h1>
              <p>{i18n.gettext(`There are thousands of free add-ons, created by developers all over
                    the world, that you can install to personalize your Firefox. From fun visual themes
                    to powerful tools that make browsing faster and safer, add-ons make your browser yours.
                    To help you get started, here are some we recommend for their stand-out performance
                    and functionality.`)}
              </p>
            </div>
            <div className="video-wrapper">
              <a className="play-video" href="#play" onClick={this.showVideo}>
                <span className="play-video-text">{i18n.gettext('Click to play')}</span>
                <span className="visually-hidden">{i18n.gettext('to find out more about add-ons')}</span>
              </a>
              <video
                poster={videoPoster}
                controls={showVideo}
                width="512"
                height="288"
                className="disco-video"
                ref={(ref) => { this.video = ref; }}
              >
                <source src={videoWebm} type="video/webm" />
                <source src={videoMp4} type="video/mp4" />
              </video>
              <div className="close-video">
                <a href="#close" onClick={this.closeVideo}>{i18n.gettext('Close video')}</a>
              </div>
            </div>
          </div>
        </header>
        {results.map((item) => (
          <AddonComponent
            addon={item}
            {...camelCaseKeys(item)}
            key={item.guid}
          />
        ))}
        <div className="amo-link">
          <a
            href="https://addons.mozilla.org/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={this.showMoreAddons}
          >
            {i18n.gettext('See more add-ons!')}
          </a>
        </div>
        <InfoDialog />
      </div>
    );
  }
}

export function loadedAddons(state) {
  return state.discoResults.map(
    (result) => {
      return {
        ...result,
        // `result` comes from the API call in `src/disco/api.js` and
        // normalizer makes everything complicated...
        // `result.addon` is actually the add-on's GUID.
        ...getAddonByGUID(state, result.addon),
      };
    }
  );
}

export function mapStateToProps(state) {
  return {
    results: loadedAddons(state),
  };
}

export function mapDispatchToProps(dispatch, { _config = config } = {}) {
  const props = { dispatch };
  if (_config.get('server')) {
    return props;
  }
  return {
    ...props,
    handleGlobalEvent(payload) {
      dispatch({ type: INSTALL_STATE, payload });
    },
  };
}

export default compose(
  withErrorHandler({ name: 'DiscoPane' }),
  connect(mapStateToProps, mapDispatchToProps),
  translate(),
)(DiscoPaneBase);
