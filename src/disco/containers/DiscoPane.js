import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { gettext as _, camelCaseProps } from 'core/utils';

import Addon from 'disco/components/Addon';
import fakeData from 'disco/fakeData';


class DiscoPane extends React.Component {
  static propTypes = {
    results: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    results: fakeData.results,
  }

  render() {
    const { results } = this.props;
    return (
      <div id="app-view" ref="container">
        <header>
          <div className="content">
            <h1>{_('Personalize Your Firefox')}</h1>
            <p>{_(`There are thousands of add-ons that let you make Firefox all your
               own—everything from fun visual themes to powerful tools and features.
               Here are a few great ones to check out.`)}</p>
          </div>
          <a href="#" className="play-video">
            <p>
              <span>{_('Click to play')}</span>
              <span className="visually-hidden">{_('to find out more about add-ons')}</span>
            </p>
          </a>
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

export default asyncConnect([{
  deferred: true,
  promise: loadDataIfNeeded,
}])(connect()(DiscoPane));
