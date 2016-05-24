import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { gettext as _, camelCaseProps } from 'core/utils';

import Addon from 'disco/components/Addon';

import mp4Video from 'disco/video/AddOns.mp4';
import webmVideo from 'disco/video/AddOns.webm';
import videoPoster from 'disco/img/AddOnsPoster.jpg';


class DiscoPane extends React.Component {
  static propTypes = {
    results: PropTypes.arrayOf(PropTypes.object),
  }

  constructor() {
    super();
    this.state = {
      showVideo: false,
    };
  }

  showVideo = (e) => {
    e.preventDefault();
    this.setState({showVideo: true});
    this.refs.video.play();
  }

  hideVideo = (e) => {
    e.preventDefault();
    this.setState({showVideo: false});
    this.refs.video.pause();
  }

  render() {
    const { results } = this.props;
    const { showVideo } = this.state;
    return (
      <div id="app-view" ref="container">
        <header className={showVideo ? 'show-video' : ''}>
          <div className="content">
            <h1>{_('Personalize Your Firefox')}</h1>
            <p>{_(dedent`There are thousands of add-ons that let you make Firefox all your
                  own—everything from fun visual themes to powerful tools and features.
                  Here are a few great ones to check out.`)}</p>
          </div>
          <div className="video">
            <div className="video-show" onClick={this.showVideo}>
              <span className="video-show-button">{_('Click to play')}</span>
              <span className="visually-hidden">{_('to find out more about add-ons')}</span>
            </div>
            <video autoPlay={showVideo} controls={showVideo} crossOrigin="anonymous"
                   poster={videoPoster} ref="video" height="285" width="510">
              <source src={mp4Video} type="video/mp4" />
              <source src={webmVideo} type="video/webm" />
            </video>
            <div className="video-close">
              <a href="#" onClick={this.hideVideo}>{_('Close video')}</a>
            </div>
          </div>
        </header>
        {results.map((item, i) => <Addon {...camelCaseProps(item)} key={i} />)}
      </div>
    );
  }
}

function loadDataIfNeeded() {
  /* istanbul ignore next */
  return Promise.resolve();
}

function mapStateToProps(state) {
  const { addons } = state;
  return {
    results: [addons['japanese-tattoo'], addons['awesome-screenshot-capture-']],
  };
}

export default asyncConnect([{
  deferred: true,
  promise: loadDataIfNeeded,
}])(connect(mapStateToProps)(DiscoPane));
