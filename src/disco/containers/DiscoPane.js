/* eslint-disable max-len */

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { camelCaseProps } from 'core/utils';

import config from 'config';
import { getDiscoveryAddons } from 'disco/api';
import { discoResults } from 'disco/actions';
import { loadEntities } from 'core/actions';
import { addChangeListeners } from 'disco/addonManager';
import {
  NAVIGATION_CATEGORY,
  VIDEO_CATEGORY,
} from 'disco/constants';
import { INSTALL_STATE } from 'core/constants';

import Addon from 'disco/components/Addon';
import InfoDialog from 'disco/components/InfoDialog';
import translate from 'core/i18n/translate';
import tracking from 'core/tracking';

import videoPoster from 'disco/img/AddOnsPoster.jpg';
import videoMp4 from 'disco/video/AddOns.mp4';
import videoWebm from 'disco/video/AddOns.webm';


export class DiscoPane extends React.Component {
  static propTypes = {
    AddonComponent: PropTypes.func.isRequred,
    handleGlobalEvent: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    infoDialogData: PropTypes.object,
    mozAddonManager: PropTypes.object,
    results: PropTypes.arrayOf(PropTypes.object),
    showInfoDialog: PropTypes.boolean,
    _addChangeListeners: PropTypes.func,
    _tracking: PropTypes.object,
  }

  static defaultProps = {
    AddonComponent: Addon,
    mozAddonManager: config.get('server') ? {} : navigator.mozAddonManager,
    _addChangeListeners: addChangeListeners,
    _tracking: tracking,
  }

  constructor() {
    super();
    this.state = { showVideo: false };
  }

  componentDidMount() {
    const { _addChangeListeners, handleGlobalEvent, mozAddonManager } = this.props;
    // Use addonManager.addChangeListener to setup and filter events.
    _addChangeListeners(handleGlobalEvent, mozAddonManager);
  }

  showVideo = (e) => {
    const { _tracking } = this.props;
    e.preventDefault();
    this.setState({ showVideo: true });
    this.refs.video.play();
    _tracking.sendEvent({
      action: 'play',
      category: VIDEO_CATEGORY,
    });
  }

  closeVideo = (e) => {
    const { _tracking } = this.props;
    e.preventDefault();
    this.setState({ showVideo: false });
    this.refs.video.pause();
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
    const { results, i18n, AddonComponent, showInfoDialog, infoDialogData } = this.props;
    const { showVideo } = this.state;

    return (
      <div id="app-view" ref="container">
        <header className={showVideo ? 'show-video' : ''}>
          <div className="disco-header">
            <div className="disco-content">
              <h1>{i18n.gettext('Personalize Your Firefox')}</h1>
              <p>{i18n.gettext(dedent`There are thousands of add-ons created by developers all over the
                    world to help you personalize your browsing experience—everything from fun visual
                    themes to powerful tools and features. Here are a few great ones to try out.`)}</p>
            </div>
            <div className="video-wrapper">
              <a className="play-video" href="#play" onClick={this.showVideo}>
                <span className="play-video-text">{i18n.gettext('Click to play')}</span>
                <span className="visually-hidden">{i18n.gettext('to find out more about add-ons')}</span>
              </a>
              <video poster={videoPoster} controls={showVideo} width="512" height="288"
                     className="disco-video" ref="video">
                <source src={videoWebm} type="video/webm" />
                <source src={videoMp4} type="video/mp4" />
              </video>
              <div className="close-video">
                <a href="#close" onClick={this.closeVideo}>{i18n.gettext('Close video')}</a>
              </div>
            </div>
          </div>
        </header>
        {results.map((item) => <AddonComponent {...camelCaseProps(item)} key={item.guid} />)}
        <div className="amo-link">
          <a href="https://addons.mozilla.org/" target="_blank"
            rel="noreferrer" onClick={this.showMoreAddons}>
            {i18n.gettext('See more add-ons!')}
          </a>
        </div>
        {showInfoDialog === true ? <InfoDialog {...infoDialogData} /> : null}
      </div>
    );
  }
}

function loadedAddons(state) {
  return state.discoResults.map((result) => ({ ...result, ...state.addons[result.addon] }));
}

export function loadDataIfNeeded({ store: { dispatch, getState } }) {
  const state = getState();
  const addons = loadedAddons(state);
  if (addons.length > 0) {
    return Promise.resolve();
  }
  return getDiscoveryAddons({ api: state.api })
    .then(({ entities, result }) => {
      dispatch(loadEntities(entities));
      dispatch(discoResults(result.results.map((r) => entities.discoResults[r])));
    });
}

export function mapStateToProps(state) {
  return {
    results: loadedAddons(state),
    showInfoDialog: state.infoDialog.show,
    infoDialogData: state.infoDialog.data,
  };
}

export function mapDispatchToProps(dispatch, { _config = config } = {}) {
  if (_config.get('server')) {
    return {};
  }
  return {
    handleGlobalEvent(payload) {
      dispatch({ type: INSTALL_STATE, payload });
    },
  };
}

export default asyncConnect([{
  deferred: true,
  promise: loadDataIfNeeded,
}])(connect(mapStateToProps, mapDispatchToProps)(translate()(DiscoPane)));
