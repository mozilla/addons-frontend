import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { sprintf } from 'sprintf-js';

import themeAction from 'disco/themePreview';
import { gettext as _ } from 'core/utils';

import InstallButton from 'disco/containers/InstallButton';
import {
  validAddonTypes,
  validInstallStates,
  ERROR,
  EXTENSION_TYPE,
  THEME_TYPE,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
} from 'disco/constants';

import 'disco/css/Addon.scss';


export default class Addon extends React.Component {
  static propTypes = {
    accentcolor: PropTypes.string,
    closeErrorAction: PropTypes.func,
    editorialDescription: PropTypes.string.isRequired,
    errorMessage: PropTypes.string,
    footerURL: PropTypes.string,
    headerURL: PropTypes.string,
    heading: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    imageURL: PropTypes.string,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    status: PropTypes.oneOf(validInstallStates).isRequired,
    subHeading: PropTypes.string,
    textcolor: PropTypes.string,
    themeAction: PropTypes.func,
    themeURL: PropTypes.string,
    type: PropTypes.oneOf(validAddonTypes).isRequired,
  }

  static defaultProps = {
    // Defaults themeAction to the imported func.
    themeAction,
  }

  getBrowserThemeData() {
    const { id, name, headerURL, footerURL, textcolor, accentcolor } = this.props;
    return JSON.stringify({id, name, headerURL, footerURL, textcolor, accentcolor});
  }

  getError() {
    const { status } = this.props;
    const errorMessage = this.props.errorMessage || _('An unexpected error occurred');
    return status === ERROR ? (<div className="error">
      <p className="message">{errorMessage}</p>
      <a className="close" href="#" onClick={this.props.closeErrorAction}>Close</a>
    </div>) : null;
  }

  getLogo() {
    const { imageURL } = this.props;
    if (this.props.type === EXTENSION_TYPE) {
      return <div className="logo"><img src={imageURL} alt="" /></div>;
    }
    return null;
  }

  getThemeImage() {
    const { name, themeURL } = this.props;
    if (this.props.type === THEME_TYPE) {
      return (<a href="#" className="theme-image"
                 data-browsertheme={this.getBrowserThemeData()}
                 onBlur={this.resetPreviewTheme}
                 onClick={this.handleClick}
                 onFocus={this.previewTheme}
                 onMouseOut={this.resetPreviewTheme}
                 onMouseOver={this.previewTheme}>
        <img src={themeURL} alt={sprintf(_('Preview %(name)s'), {name})} /></a>);
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
    const { heading, slug, subHeading, type } = this.props;

    if (validAddonTypes.indexOf(type) === -1) {
      throw new Error('Invalid addon type');
    }

    const addonClasses = classNames('addon', {
      theme: type === THEME_TYPE,
    });

    return (
      <div className={addonClasses}>
        {this.getThemeImage()}
        {this.getLogo()}
        <div className="content">
          {this.getError()}
          <div className="copy">
            <h2 ref="heading" className="heading">{heading} {subHeading ?
              <span ref="sub-heading" className="sub-heading">{subHeading}</span> : null}</h2>
            <p ref="editorial-description"
               className="editorial-description"
               dangerouslySetInnerHTML={this.getDescription()} />
          </div>
          <div className="install-button">
            <InstallButton slug={slug} />
          </div>
        </div>
      </div>
    );
  }
}
