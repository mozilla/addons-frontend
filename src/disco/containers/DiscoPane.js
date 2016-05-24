import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { gettext as _, camelCaseProps } from 'core/utils';

import Addon from 'disco/components/Addon';

import videoPoster from 'disco/img/AddOnsPoster.jpg';
import videoMp4 from 'disco/video/AddOns.mp4';
import videoWebm from 'disco/video/AddOns.webm';


class DiscoPane extends React.Component {
  static propTypes = {
    results: PropTypes.arrayOf(PropTypes.object),
  }

  constructor() {
    super();
    this.state = {showVideo: false};
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
    const { results } = this.props;
    const { showVideo } = this.state;

    return (
      <div id="app-view" ref="container">
        <header className={showVideo ? 'show-video' : ''}>
          <div className="disco-header">
            <div className="content">
              <h1>{_('Personalize Your Firefox')}</h1>
              <p>{_(dedent`There are thousands of add-ons that let you make Firefox all your
                    own—everything from fun visual themes to powerful tools and features.
                    Here are a few great ones to check out.`)}</p>
            </div>
            <div className="video-wrapper">
              <a className="play-video" href="#play" onClick={this.showVideo}>
                <span className="play-video-text">{_('► Click to play')}</span>
                <span className="visually-hidden">{_('to find out more about add-ons')}</span>
              </a>
              <video poster={videoPoster} controls={showVideo} width="510" height="283" ref="video">
                <source src={videoWebm} type="video/webm" />
                <source src={videoMp4} type="video/mp4" />
              </video>
              <div className="close-video">
                <a href="#close" onClick={this.closeVideo}>{_('Close video')}</a>
              </div>
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
