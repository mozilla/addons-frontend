/* eslint-disable max-len */

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { camelCaseProps } from 'core/utils';

import config from 'config';
import { getDiscoveryAddons } from 'disco/api';
import { discoResults } from 'disco/actions';
import { loadEntities } from 'core/actions';
import log from 'core/logger';

import Addon from 'disco/components/Addon';
import translate from 'core/i18n/translate';

import videoPoster from 'disco/img/AddOnsPoster.jpg';
import videoMp4 from 'disco/video/AddOns.mp4';
import videoWebm from 'disco/video/AddOns.webm';

import {
  globalEvents,
  ON_ENABLE,
  ON_DISABLE,
  ON_INSTALLING,
  ON_UNINSTALLING,
  ON_INSTALLED,
  ON_UNINSTALLED,
} from 'disco/constants';


export class DiscoPane extends React.Component {
  static propTypes = {
    handleGlobalEvent: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    results: PropTypes.arrayOf(PropTypes.object),
    AddonComponent: PropTypes.object.isRequred,
    mozAddonManager: PropTypes.object.isRequired,
  }

  static defaultProps = {
    AddonComponent: Addon,
    mozAddonManager: config.get('server') ? {} : navigator.mozAddonManager,
  }

  constructor() {
    super();
    this.state = {showVideo: false};
  }

  componentDidMount() {
    const { handleGlobalEvent, mozAddonManager } = this.props;
    if (mozAddonManager && mozAddonManager.addEventListener) {
      for (const event of globalEvents) {
        mozAddonManager.addEventListener(event, handleGlobalEvent);
      }
    } else {
      log.info('mozAddonManager.addEventListener not available');
    }
  }

  showVideo = (e) => {
    e.preventDefault();
    this.setState({showVideo: true});
    this.refs.video.play();
  }

  closeVideo = (e) => {
    e.preventDefault();
    this.setState({showVideo: false});
    this.refs.video.pause();
  }

  render() {
    const { results, i18n, AddonComponent } = this.props;
    const { showVideo } = this.state;

    return (
      <div id="app-view" ref="container">
        <header className={showVideo ? 'show-video' : ''}>
          <div className="disco-header">
            <div className="disco-content">
              <h1>{i18n.gettext('Personalize Your Firefox')}</h1>
              <p>{i18n.gettext(dedent`There are thousands of add-ons that let you make Firefox all your
                    own—everything from fun visual themes to powerful tools and features.
                    Here are a few great ones to check out.`)}</p>
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
          <a href="https://addons.mozilla.org/" target="_blank" rel="noreferrer">
            {i18n.gettext('See more add-ons!')}
          </a>
        </div>
      </div>
    );
  }
}

function loadedAddons(state) {
  return state.discoResults.map((result) => ({...result, ...state.addons[result.addon]}));
}

export function loadDataIfNeeded({ store: { dispatch, getState }}) {
  const state = getState();
  const addons = loadedAddons(state);
  if (addons.length > 0) {
    return Promise.resolve();
  }
  return getDiscoveryAddons({api: state.api})
    .then(({ entities, result }) => {
      dispatch(loadEntities(entities));
      dispatch(discoResults(result.results.map((r) => entities.discoResults[r])));
    });
}

export function mapStateToProps(state) {
  return {
    results: loadedAddons(state),
  };
}

export function mapDispatchToProps(dispatch, { _config = config } = {}) {
  if (_config.get('server')) {
    return {};
  }
  return {
    handleGlobalEvent(e) {
      const { id, type, needsRestart } = e;
      const payload = { guid: id, needsRestart };
      log.info('Event received', type, id, needsRestart);
      switch (type) {
        case 'onDisabled':
          dispatch({type: ON_DISABLE, payload});
          break;
        case 'onEnabled':
          dispatch({type: ON_ENABLE, payload});
          break;
        case 'onInstalling':
          dispatch({type: ON_INSTALLING, payload});
          break;
        case 'onInstalled':
          dispatch({type: ON_INSTALLED, payload});
          break;
        case 'onUninstalling':
          dispatch({type: ON_UNINSTALLING, payload});
          break;
        case 'onUninstalled':
          dispatch({type: ON_UNINSTALLED, payload});
          break;
        default:
          throw new Error(`Unknown global event: ${type}`);
      }
    },
  };
}

export default asyncConnect([{
  deferred: true,
  promise: loadDataIfNeeded,
}])(connect(mapStateToProps, mapDispatchToProps)(translate()(DiscoPane)));
