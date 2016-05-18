import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { gettext as _ } from 'core/utils';

import 'disco/css/InstallButton.scss';
import { AddonManager } from 'disco/addonManager';
import {
  DOWNLOADING,
  INSTALLED,
  UNINSTALLED,
  UNKNOWN,
  validInstallStates as validStates,
} from 'disco/constants';

export class InstallButton extends React.Component {
  static propTypes = {
    install: PropTypes.func,
    uninstall: PropTypes.func,
    handleChange: PropTypes.func,
    dispatch: PropTypes.func.isRequired,
    guid: PropTypes.string,
    installURL: PropTypes.string,
    url: PropTypes.string,
    downloadProgress: PropTypes.number,
    slug: PropTypes.string.isRequired,
    status: PropTypes.oneOf(validStates),
  }

  static defaultProps = {
    status: UNKNOWN,
    downloadProgress: 0,
  }

  componentDidMount() {
    const { dispatch, guid, installURL, slug } = this.props;
    this.addonManager = new AddonManager(guid, installURL, this.statusChanged);
    this.addonManager.getAddon()
      .then(() => {
        dispatch({
          type: 'INSTALL_STATE',
          payload: {slug, guid, url: installURL, status: INSTALLED}});
      })
      .catch(() => {
        dispatch({
          type: 'INSTALL_STATE',
          payload: {slug, guid, url: installURL, status: UNINSTALLED}});
      });
  }

  statusChanged = (addonInstall) => {
    const { dispatch, slug } = this.props;
    if (addonInstall.state === 'STATE_DOWNLOADING') {
      const downloadProgress = parseInt(
        100 * addonInstall.progress / addonInstall.maxProgress, 10);
      dispatch({type: 'DOWNLOAD_PROGRESS', payload: {slug, downloadProgress}});
    } else if (addonInstall.state === 'STATE_INSTALLING') {
      dispatch({type: 'START_INSTALL', payload: {slug}});
    } else if (addonInstall.state === 'STATE_INSTALLED') {
      dispatch({type: 'INSTALL_COMPLETE', payload: {slug}});
    }
  }

  install() {
    const { dispatch, slug } = this.props;
    dispatch({type: 'START_DOWNLOAD', payload: {slug}});
    this.addonManager.install();
  }

  uninstall() {
    const { dispatch, slug } = this.props;
    dispatch({type: 'START_UNINSTALL', payload: {slug}});
    this.addonManager.uninstall()
      .then(() => dispatch({type: 'UNINSTALL_COMPLETE', payload: {slug}}));
  }

  handleClick = () => {
    const { status } = this.props;
    if (status === UNINSTALLED) {
      this.install();
    } else if (status === INSTALLED) {
      this.uninstall();
    }
  }

  render() {
    const { downloadProgress, slug, status } = this.props;

    if (!validStates.includes(status)) {
      throw new Error('Invalid add-on status');
    }

    const isInstalled = status === INSTALLED;
    const isDisabled = status === UNKNOWN;
    const isDownloading = status === DOWNLOADING;
    const switchClasses = `switch ${status}`;
    const identifier = `install-button-${slug}`;

    return (
      <div className={switchClasses} onClick={this.handleClick}
        data-download-progress={isDownloading ? downloadProgress : 0}>
        <input
          id={identifier}
          className="visually-hidden"
          checked={isInstalled}
          disabled={isDisabled}
          onChange={this.props.handleChange}
          type="checkbox" />
        <label htmlFor={identifier}>
          {isDownloading ? <div className="progress"></div> : null}
          <span className="visually-hidden">{_('Install')}</span>
        </label>
      </div>
    );
  }
}

export function mapStateToProps(state, ownProps) {
  const installation = state.installations[ownProps.slug] || {};
  const addon = state.addons[ownProps.slug] || {};
  return {...installation, ...addon};
}

export default connect(mapStateToProps)(InstallButton);
