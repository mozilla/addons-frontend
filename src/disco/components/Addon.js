import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { sprintf } from 'sprintf-js';
import translate from 'core/i18n/translate';
import purify from 'core/purify';

import themeAction, { getThemeData } from 'disco/themePreview';

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

function sanitizeHTML(text, allowTags = []) {
  // TODO: Accept tags to allow and run through dom-purify.
  return {
    __html: purify.sanitize(text, {ALLOWED_TAGS: allowTags}),
  };
}

export class Addon extends React.Component {
  static propTypes = {
    accentcolor: PropTypes.string,
    closeErrorAction: PropTypes.func,
    description: PropTypes.string,
    editorialDescription: PropTypes.string.isRequired,
    errorMessage: PropTypes.string,
    footerURL: PropTypes.string,
    headerURL: PropTypes.string,
    heading: PropTypes.string.isRequired,
    i18n: PropTypes.string.isRequired,
    iconUrl: PropTypes.string,
    id: PropTypes.string.isRequired,
    previewURL: PropTypes.string,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    status: PropTypes.oneOf(validInstallStates).isRequired,
    textcolor: PropTypes.string,
    themeAction: PropTypes.func,
    type: PropTypes.oneOf(validAddonTypes).isRequired,
  }

  static defaultProps = {
    // Defaults themeAction to the imported func.
    themeAction,
  }

  getBrowserThemeData() {
    return JSON.stringify(getThemeData(this.props));
  }

  getError() {
    const { status, i18n } = this.props;
    const errorMessage = this.props.errorMessage || i18n.gettext('An unexpected error occurred');
    return status === ERROR ? (<div className="error">
      <p className="message">{errorMessage}</p>
      <a className="close" href="#" onClick={this.props.closeErrorAction}>Close</a>
    </div>) : null;
  }

  getLogo() {
    const { iconUrl } = this.props;
    if (this.props.type === EXTENSION_TYPE) {
      return <div className="logo"><img src={iconUrl} alt="" /></div>;
    }
    return null;
  }

  getThemeImage() {
    const { i18n, name, previewURL } = this.props;
    if (this.props.type === THEME_TYPE) {
      return (<a href="#" className="theme-image"
                 data-browsertheme={this.getBrowserThemeData()}
                 onBlur={this.resetPreviewTheme}
                 onClick={this.handleClick}
                 onFocus={this.previewTheme}
                 onMouseOut={this.resetPreviewTheme}
                 onMouseOver={this.previewTheme}>
        <img src={previewURL} alt={sprintf(i18n.gettext('Preview %(name)s'), {name})} /></a>);
    }
    return null;
  }

  getDescription() {
    const { i18n, description, type } = this.props;
    if (type === THEME_TYPE) {
      return (
        <p className="editorial-description">{i18n.gettext('Hover over the image to preview')}</p>
      );
    }
    return (
      <div
        ref="editorialDescription"
        className="editorial-description"
        dangerouslySetInnerHTML={sanitizeHTML(description, ['blockquote', 'cite'])} />
    );
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
    const { heading, slug, type } = this.props;

    if (!validAddonTypes.includes(type)) {
      throw new Error(`Invalid addon type "${type}"`);
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
            <h2
              ref="heading"
              className="heading"
              dangerouslySetInnerHTML={sanitizeHTML(heading, ['span'])} />
            {this.getDescription()}
          </div>
          <div className="install-button">
            <InstallButton slug={slug} />
          </div>
        </div>
      </div>
    );
  }
}

export default translate({withRef: true})(Addon);
