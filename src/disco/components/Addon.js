import React, { PropTypes } from 'react';
import classNames from 'classnames';

import InstallButton from './InstallButton';

import 'disco/css/Addon.scss';


export default class Addon extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    heading: PropTypes.string.isRequired,
    subHeading: PropTypes.string,
    editorialDescription: PropTypes.string.isRequired,
  }

  getLogo() {
    const { id } = this.props;
    const imageURL = `https://addons-dev-cdn.allizom.org/user-media/addon_icons/0/${id}-64.png?modified=1388632826`;
    if (this.props.type === 'Extension') {
      return <div className="logo"><img src={imageURL} alt="" /></div>;
    }
    return null;
  }

  getThemeImage() {
    const { id } = this.props;
    const themeURL = `https://addons-dev-cdn.allizom.org/user-media/addons/${id}/preview_large.jpg?1239806327`;
    if (this.props.type === 'Theme') {
      return <img className="theme-image" src={themeURL} alt="" />;
    }
    return null;
  }

  getDescription() {
    return { __html: this.props.editorialDescription };
  }

  render() {
    const { heading, subHeading, type } = this.props;
    const addonClasses = classNames('addon', {
      theme: type === 'Theme',
    });
    return (
      <div className={addonClasses}>
        {this.getThemeImage()}
        <div className="content">
          {this.getLogo()}
          <div className="copy">
            <h2 ref="heading" className="heading">{heading} {subHeading ?
              <span ref="sub-heading" className="sub-heading">{subHeading}</span> : null}</h2>
            <p ref="editorial-description"
               className="editorial-description"
               dangerouslySetInnerHTML={this.getDescription()} />
          </div>
          <div className="install-button">
            <InstallButton />
          </div>
        </div>
      </div>
    );
  }
}
