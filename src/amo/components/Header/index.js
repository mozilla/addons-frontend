import config from 'config';
import PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import DownloadFirefoxButton from 'amo/components/DownloadFirefoxButton';
import Link from 'amo/components/Link';
import SearchForm from 'amo/components/SearchForm';
import SectionLinks from 'amo/components/SectionLinks';
import AuthenticateButton, {
  createHandleLogOutFunction,
} from 'core/components/AuthenticateButton';
import {
  getCurrentUser,
  hasAnyReviewerRelatedPermission,
} from 'amo/reducers/users';
import { VIEW_CONTEXT_HOME } from 'core/constants';
import translate from 'core/i18n/translate';
import DropdownMenu from 'ui/components/DropdownMenu';
import DropdownMenuItem from 'ui/components/DropdownMenuItem';

import './styles.scss';

export class HeaderBase extends React.Component {
  static propTypes = {
    _config: PropTypes.object,
    api: PropTypes.object.isRequired,
    handleLogOut: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    isHomePage: PropTypes.bool,
    location: PropTypes.object.isRequired,
    query: PropTypes.string,
    siteUser: PropTypes.object,
    isReviewer: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    _config: config,
    isHomePage: false,
    query: '',
  };

  handleLogOut = (event) => {
    event.preventDefault();

    this.props.handleLogOut({ api: this.props.api });
  };

  render() {
    const {
      _config,
      i18n,
      isHomePage,
      location,
      query,
      siteUser,
      isReviewer,
    } = this.props;

    const headerLink = (
      <Link className="Header-title" to="/">
        <span className="visually-hidden">
          {// translators: "Firefox" should not be translated. :-)
          i18n.gettext('Firefox Add-ons')}
        </span>
      </Link>
    );

    const viewProfileURL = siteUser ? `/user/${siteUser.username}/` : null;
    const viewProfileLinkProps = _config.get('enableUserProfile')
      ? { to: viewProfileURL }
      : { href: viewProfileURL };
    const editProfileURL = siteUser ? '/users/edit' : null;
    const editProfileLinkProps = _config.get('enableUserProfile')
      ? { to: editProfileURL }
      : { href: editProfileURL };

    const enableNewCollectionsUI = _config.get('enableNewCollectionsUI');
    let myCollectionsURL = null;
    if (siteUser) {
      myCollectionsURL = enableNewCollectionsUI
        ? '/collections/'
        : `/collections/${siteUser.username}/`;
    }
    const myCollectionsLinkProps = enableNewCollectionsUI
      ? { to: myCollectionsURL }
      : { href: myCollectionsURL };

    return (
      <header className="Header">
        <div className="Header-content">
          {isHomePage ? (
            <h1 className="Header-title-wrapper">{headerLink}</h1>
          ) : (
            headerLink
          )}
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
          <DownloadFirefoxButton className="Header-download-button Header-button" />

          {siteUser ? (
            <DropdownMenu
              text={siteUser.name}
              className="Header-authenticate-button Header-button"
            >
              <DropdownMenuItem>{i18n.gettext('My Account')}</DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  className="Header-user-menu-collections-link"
                  {...myCollectionsLinkProps}
                >
                  {i18n.gettext('View My Collections')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  className="Header-user-menu-view-profile-link"
                  {...viewProfileLinkProps}
                >
                  {i18n.gettext('View My Profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  className="Header-user-menu-edit-profile-link"
                  {...editProfileLinkProps}
                >
                  {i18n.gettext('Edit My Profile')}
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
                <Link href="/developers/theme/submit" prependClientApp={false}>
                  {i18n.gettext('Submit a New Theme')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/developers/addons" prependClientApp={false}>
                  {i18n.gettext('Manage My Submissions')}
                </Link>
              </DropdownMenuItem>
              {isReviewer && (
                <DropdownMenuItem>
                  <Link
                    className="Header-user-menu-reviewer-tools-link"
                    href="/reviewers/"
                    prependClientApp={false}
                  >
                    {i18n.gettext('Reviewer Tools')}
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className="Header-logout-button"
                detached
                onClick={this.handleLogOut}
              >
                {i18n.gettext('Log out')}
              </DropdownMenuItem>
            </DropdownMenu>
          ) : (
            <AuthenticateButton
              className="Header-authenticate-button Header-button"
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
    isHomePage: state.viewContext.context === VIEW_CONTEXT_HOME,
    siteUser: getCurrentUser(state.users),
    isReviewer: hasAnyReviewerRelatedPermission(state),
  };
};

export const mapDispatchToProps = (dispatch, ownProps) => ({
  handleLogOut: ownProps.handleLogOut || createHandleLogOutFunction(dispatch),
});

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(HeaderBase);
