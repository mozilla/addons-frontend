import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { gettext as _ } from 'core/utils';

import 'disco/css/InstallButton.scss';
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
    guid: PropTypes.string,
    url: PropTypes.string,
    downloadProgress: PropTypes.number,
    slug: PropTypes.string.isRequired,
    status: PropTypes.oneOf(validStates),
  }

  static defaultProps = {
    status: UNKNOWN,
    downloadProgress: 0,
  }

  handleClick = () => {
    const { status } = this.props;
    if (status === UNINSTALLED) {
      this.props.install();
    } else if (status === INSTALLED) {
      this.props.uninstall();
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

    return (
      <div className={switchClasses} onClick={this.handleClick}
        data-download-progress={isDownloading ? downloadProgress : 0}>
        <input
          id={slug}
          className="visually-hidden"
          checked={isInstalled}
          disabled={isDisabled}
          onChange={this.props.handleChange}
          type="checkbox" />
        <label htmlFor={slug}>
          {isDownloading ? <div className="progress"></div> : null}
          <span className="visually-hidden">{_('Install')}</span>
        </label>
      </div>
    );
  }
}

export function mapStateToProps(state, ownProps) {
  return (state.installations || {})[ownProps.slug] || {};
}

export function mapDispatchToProps(dispatch, ownProps) {
  const { slug } = ownProps;
  const url = 'foo';
  const guid = 'foo@foo.com';
  dispatch({type: 'INSTALL_STATE', payload: {slug, guid, url, status: UNINSTALLED}});
  /* istanbul ignore next */
  return {
    install() {
      dispatch({type: 'START_DOWNLOAD', payload: {slug, guid, url}});
      let downloadProgress = 0;
      const downloading = setInterval(() => {
        downloadProgress += Math.ceil(Math.random() * 10 + 15);
        downloadProgress = Math.min(downloadProgress, 100);
        dispatch({type: 'DOWNLOAD_PROGRESS', payload: {slug, downloadProgress}});
        if (downloadProgress >= 100) {
          clearInterval(downloading);
          dispatch({type: 'START_INSTALL', payload: {slug}});
          setTimeout(() => {
            dispatch({type: 'INSTALL_COMPLETE', payload: {slug}});
          }, 5000);
        }
      }, 500);
    },
    uninstall() {
      dispatch({type: 'START_UNINSTALL', payload: {slug}});
      setTimeout(() => {
        dispatch({type: 'UNINSTALL_COMPLETE', payload: {slug}});
      }, 5000);
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(InstallButton);
