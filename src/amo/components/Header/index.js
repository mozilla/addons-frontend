import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import DownloadFirefoxButton from 'amo/components/DownloadFirefoxButton';
import Link from 'amo/components/Link';
import SearchForm from 'amo/components/SearchForm';
import SectionLinks from 'amo/components/SectionLinks';
import AuthenticateButton, {
  createHandleLogOutFunction,
} from 'core/components/AuthenticateButton';
import { isAuthenticated, selectDisplayName } from 'core/reducers/user';
import { VIEW_CONTEXT_HOME } from 'core/constants';
import translate from 'core/i18n/translate';
import DropdownMenu from 'ui/components/DropdownMenu';
import DropdownMenuItem from 'ui/components/DropdownMenuItem';

import './styles.scss';


export class HeaderBase extends React.Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    displayName: PropTypes.string,
    handleLogOut: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
    isHomePage: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    query: PropTypes.string.isRequired,
    username: PropTypes.string,
  }

  static defaultProps = {
    isHomePage: false,
    query: '',
  }

  handleLogOut = (event) => {
    event.preventDefault();

    this.props.handleLogOut({ api: this.props.api });
  }

  render() {
    const {
      displayName,
      i18n,
      isHomePage,
      location,
      query,
      username,
    } = this.props;

    const headerLink = (
      <Link className="Header-title" to="/">
        <span className="visually-hidden">
          {
            // translators: "Firefox" should not be translated. :-)
            i18n.gettext('Firefox Add-ons')
          }
        </span>
      </Link>
    );

    return (
      <header className="Header">
        <div className="Header-content">
          {isHomePage
            ? <h1 className="Header-title-wrapper">{headerLink}</h1>
            : headerLink}
        </div>

        <SectionLinks className="Header-SectionLinks" location={location} />

        <div className="Header-user-and-external-links">
          <Link
            className="Header-developer-hub-link Header-button"
            href="/developers/"
            external
            prependClientApp={false}
          >
            {i18n.gettext('Developer Hub')}
          </Link>
          <DownloadFirefoxButton
            className="Header-download-button Header-button"
          />

          {this.props.isAuthenticated ? (
            <DropdownMenu
              text={displayName}
              className="Header-authenticate-button Header-button"
            >
              <DropdownMenuItem>{i18n.gettext('My Account')}</DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  className="Header-user-menu-collections-link"
                  href={`/collections/${username}/`}
                >
                  {i18n.gettext('View My Collections')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href={`/user/${username}/`}>
                  {i18n.gettext('View Profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/users/edit">
                  {i18n.gettext('Edit Profile')}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem>{i18n.gettext('Tools')}</DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href="/developers/addon/submit/distribution"
                  prependClientApp={false}
                >
                  {i18n.gettext('Submit a New Add-on')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href="/developers/theme/submit"
                  prependClientApp={false}
                >
                  {i18n.gettext('Submit a New Theme')}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                className={'Header-logout-button'}
                detached
                onClick={this.handleLogOut}
              >
                {i18n.gettext('Log out')}
              </DropdownMenuItem>
            </DropdownMenu>
          ) : (
            <AuthenticateButton
              className="Header-authenticate-button Header-button Button--action
              Button--outline-only Button--small"
              location={location}
              noIcon
            />
          )}
        </div>

        <SearchForm
          className="Header-search-form"
          pathname="/search/"
          query={query}
        />
      </header>
    );
  }
}

export const mapStateToProps = (state) => {
  return {
    api: state.api,
    displayName: selectDisplayName(state),
    isHomePage: state.viewContext.context === VIEW_CONTEXT_HOME,
    isAuthenticated: isAuthenticated(state),
    username: state.user.username,
  };
};

export const mapDispatchToProps = (dispatch, ownProps) => ({
  handleLogOut: ownProps.handleLogOut || createHandleLogOutFunction(dispatch),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  translate(),
)(HeaderBase);
