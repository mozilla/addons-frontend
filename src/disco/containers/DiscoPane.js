import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { gettext as _, camelCaseProps } from 'core/utils';

import Addon from 'disco/components/Addon';

import mp4Video from 'disco/video/AddOns.mp4';
import webmVideo from 'disco/video/AddOns.webm';


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

  showVideo = () => {
    this.setState({showVideo: !this.state.showVideo});
  }

  hideVideo = () => {
    this.setState({showVideo: false});
  }

  render() {
    const { results } = this.props;
    const { showVideo } = this.state;
    let video = null;
    if (showVideo) {
      video = (
        <div className="video-wrapper">
          <video controls crossOrigin="anonymous">
            <source src={mp4Video} type="video/mp4" />
            <source src={webmVideo} type="video/webm" />
          </video>
          <div>
            <a href="#" onClick={this.hideVideo}>{_('Close video')}</a>
          </div>
        </div>
      );
    }
    return (
      <div id="app-view" ref="container">
        <header className={showVideo ? 'show-video' : ''}>
          <div className="content">
            <h1>{_('Personalize Your Firefox')}</h1>
            <p>{_(`There are thousands of add-ons that let you make Firefox all your
               own—everything from fun visual themes to powerful tools and features.
               Here are a few great ones to check out.`)}</p>
          </div>
          <div className="video">
            <div className="video-placeholder" onClick={this.showVideo}>
              <span>{_('Click to play')}</span>
              <span className="visually-hidden">{_('to find out more about add-ons')}</span>
            </div>
            <div className="video-wrapper">
              <video controls crossOrigin="anonymous">
                <source src={mp4Video} type="video/mp4" />
                <source src={webmVideo} type="video/webm" />
              </video>
              <div>
                <a href="#" onClick={this.hideVideo} className="video-close">{_('Close video')}</a>
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
