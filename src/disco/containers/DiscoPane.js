import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { gettext as _, camelCaseProps } from 'core/utils';

import Addon from 'disco/components/Addon';


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
    this.setState({showVideo: true});
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
          <video autoPlay autostart preload controls crossOrigin="anonymous">
            <source src={require('disco/video/AddOns.mp4')} type="video/mp4" />
            <source src={require('disco/video/AddOns.webm')} type="video/webm" />
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
          <a href="#play" onClick={this.showVideo} className="play-video">
            <p>
              <span>{_('Click to play')}</span>
              <span className="visually-hidden">{_('to find out more about add-ons')}</span>
            </p>
          </a>
          {video}
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
