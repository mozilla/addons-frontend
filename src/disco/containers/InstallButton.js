import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { gettext as _ } from 'core/utils';

import 'disco/css/InstallButton.scss';
import {
  DOWNLOADING,
  INSTALLED,
  UNKNOWN,
  validInstallStates as validStates,
} from 'disco/constants';

export class InstallButton extends React.Component {
  static propTypes = {
    handleClick: PropTypes.func,
    handleChange: PropTypes.func,
    guid: PropTypes.string,
    progress: PropTypes.number,
    slug: PropTypes.string.isRequired,
    state: PropTypes.oneOf(validStates),
  }

  static defaultProps = {
    state: UNKNOWN,
    progress: 0,
  }

  render() {
    const { state, progress } = this.props;

    if (validStates.indexOf(state) === -1) {
      throw new Error('Invalid add-on state');
    }

    const isInstalled = state === INSTALLED;
    const isDisabled = state === UNKNOWN;
    const isDownloading = state === DOWNLOADING;
    const switchClasses = `switch ${state}`;

    return (
      <div className={switchClasses} onClick={this.props.handleClick}
        data-download-progress={isDownloading ? progress : 0}>
        <input
          className="visually-hidden"
          checked={isInstalled}
          disabled={isDisabled}
          onChange={this.props.handleChange}
          type="checkbox" />
        <label>
          {isDownloading ? <div className="progress"></div> : null}
          <span className="visually-hidden">{_('Install')}</span>
        </label>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return (state.installations || {})[ownProps.slug];
}

export default connect(mapStateToProps)(InstallButton);
