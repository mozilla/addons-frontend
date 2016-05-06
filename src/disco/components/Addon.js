import React, { PropTypes } from 'react';
import classNames from 'classnames';
import themeAction from 'disco/themePreview';
import { gettext as _ } from 'core/utils';

import InstallButton from './InstallButton';
import {
  validAddonTypes,
  EXTENSION_TYPE,
  THEME_TYPE,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
} from 'disco/constants';

import 'disco/css/Addon.scss';


export default class Addon extends React.Component {
  static propTypes = {
    accentcolor: PropTypes.string,
    editorialDescription: PropTypes.string.isRequired,
    footerURL: PropTypes.string,
    headerURL: PropTypes.string,
    heading: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    subHeading: PropTypes.string,
    textcolor: PropTypes.string,
    type: PropTypes.oneOf(validAddonTypes).isRequired,
    themeAction: PropTypes.func,
  }

  static defaultProps = {
    // Defaults themeAction to the imported func.
    themeAction,
  }

  getBrowserThemeData() {
    const { id, name, headerURL, footerURL, textcolor, accentcolor } = this.props;
    return JSON.stringify({id, name, headerURL, footerURL, textcolor, accentcolor});
  }

  getLogo() {
    const { id } = this.props;
    const imageURL = `https://addons-dev-cdn.allizom.org/user-media/addon_icons/0/${id}-64.png?modified=1388632826`;
    if (this.props.type === EXTENSION_TYPE) {
      return <div className="logo"><img src={imageURL} alt="" /></div>;
    }
    return null;
  }

  getThemeImage() {
    const { id, name } = this.props;
    const themeURL = `https://addons-dev-cdn.allizom.org/user-media/addons/${id}/preview_large.jpg?1239806327`;
    if (this.props.type === THEME_TYPE) {
      return (<a href="#" className="theme-image"
                 data-browsertheme={this.getBrowserThemeData()}
                 onBlur={this.resetPreviewTheme}
                 onClick={this.handleClick}
                 onFocus={this.previewTheme}
                 onMouseOut={this.resetPreviewTheme}
                 onMouseOver={this.previewTheme}>
        <img src={themeURL} alt={_(`Preview ${name}`)} /></a>);
    }
    return null;
  }

  getDescription() {
    return { __html: this.props.editorialDescription };
  }

  handleClick = (e) => {
    e.preventDefault();
  }

  previewTheme = (e) => {
    this.props.themeAction(e.currentTarget, THEME_PREVIEW);
  }

  resetPreviewTheme = (e) => {
    this.props.themeAction(e.currentTarget, THEME_RESET_PREVIEW);
  }

  render() {
    const { heading, subHeading, type } = this.props;

    if (validAddonTypes.indexOf(type) === -1) {
      throw new Error('Invalid addon type');
    }

    const addonClasses = classNames('addon', {
      theme: type === THEME_TYPE,
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
