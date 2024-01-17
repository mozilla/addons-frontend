import PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';
import makeClassName from 'classnames';

import GetFirefoxBanner from 'amo/components/GetFirefoxBanner';
import Link from 'amo/components/Link';
import SearchForm from 'amo/components/SearchForm';
import SectionLinks from 'amo/components/SectionLinks';
import AuthenticateButton, {
  createHandleLogOutFunction,
} from 'amo/components/AuthenticateButton';
import {
  getCurrentUser,
  hasAnyReviewerRelatedPermission,
} from 'amo/reducers/users';
import { makeQueryStringWithUTM } from 'amo/utils';
import { isFirefox } from 'amo/utils/compatibility';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import translate from 'amo/i18n/translate';
import DropdownMenu from 'amo/components/DropdownMenu';
import DropdownMenuItem from 'amo/components/DropdownMenuItem';

import './styles.scss';

export class HeaderBase extends React.Component {
  static propTypes = {
    _config: PropTypes.object,
    api: PropTypes.object.isRequired,
    clientApp: PropTypes.string.isRequired,
    handleLogOut: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    isAddonInstallPage: PropTypes.bool,
    isHomePage: PropTypes.bool,
    isReviewer: PropTypes.bool.isRequired,
    loadedPageIsAnonymous: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    siteIsReadOnly: PropTypes.bool.isRequired,
    siteUser: PropTypes.object,
    userAgentInfo: PropTypes.object,
    forBlog: PropTypes.bool,
  };

  static defaultProps = { _config: config, forBlog: false };

  handleLogOut = (event) => {
    event.preventDefault();

    this.props.handleLogOut({ api: this.props.api });
  };

  renderMenuOrAuthButton() {
    const {
      i18n,
      isReviewer,
      loadedPageIsAnonymous,
      siteIsReadOnly,
      siteUser,
    } = this.props;

    if (loadedPageIsAnonymous) {
      // The server has loaded a page that is marked as anonymous so we do not
      // want to render any menu or authentication button here so that
      // logged-in users are not confused.
      return null;
    }

    return siteUser ? (
      <DropdownMenu
        text={siteUser.name}
        className="Header-authenticate-button Header-button"
      >
        <DropdownMenuItem>{i18n.gettext('My Account')}</DropdownMenuItem>
        <DropdownMenuItem>
          <Link
            className="Header-user-menu-collections-link"
            to="/collections/"
          >
            {i18n.gettext('View My Collections')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link
            className="Header-user-menu-view-profile-link"
            to={siteUser ? `/user/${siteUser.id}/` : null}
          >
            {i18n.gettext('View My Profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link
            className="Header-user-menu-edit-profile-link"
            to={siteUser ? '/users/edit' : null}
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
          <Link
            href="/developers/addon/submit/theme/distribution"
            prependClientApp={false}
          >
            {i18n.gettext('Submit a New Theme')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link
            className="Header-user-menu-developers-submissions-link"
            href="/developers/addons/"
            prependClientApp={false}
          >
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
          disabled={siteIsReadOnly}
          onClick={this.handleLogOut}
          title={
            siteIsReadOnly
              ? i18n.gettext(
                  'This action is currently unavailable. Please reload the page in a moment.',
                )
              : null
          }
        >
          {i18n.gettext('Log out')}
        </DropdownMenuItem>
      </DropdownMenu>
    ) : (
      <AuthenticateButton
        buttonType="none"
        className="Header-authenticate-button Header-button"
        noIcon
      />
    );
  }

  render() {
    const {
      _config,
      clientApp,
      forBlog,
      i18n,
      isAddonInstallPage,
      isHomePage,
      loadedPageIsAnonymous,
      location,
      userAgentInfo,
    } = this.props;

    const headerLink = (
      <Link
        className="Header-title"
        to="/"
        prependClientApp={!forBlog}
        prependLang={!forBlog}
      >
        <span className="visually-hidden">
          {
            // L10n: "Firefox" should not be translated. :-)
            i18n.gettext('Firefox Browser Add-ons')
          }
        </span>
      </Link>
    );

    const otherSiteLinks = isFirefox({ userAgentInfo }) ? (
      <>
        <Link
          className="Header-blog-link Header-button"
          href="/blog/"
          prependClientApp={false}
          prependLang={false}
        >
          {i18n.gettext('Firefox Add-ons Blog')}
        </Link>
        <Link
          className="Header-extension-workshop-link Header-button"
          href={`${_config.get(
            'extensionWorkshopUrl',
          )}/${makeQueryStringWithUTM({
            utm_content: 'header-link',
            utm_campaign: null,
          })}`}
          external
          prependClientApp={false}
          prependLang={false}
          target="_blank"
          title={i18n.gettext('Learn how to create extensions and themes')}
        >
          {i18n.gettext('Extension Workshop')}
        </Link>
        <Link
          className="Header-developer-hub-link Header-button"
          href="/developers/"
          external
          prependClientApp={false}
          target="_blank"
          title={i18n.gettext('Submit and manage extensions and themes')}
        >
          {i18n.gettext('Developer Hub')}
        </Link>
      </>
    ) : null;

    return (
      <header
        className={makeClassName('Header', {
          'Header--loaded-page-is-anonymous': loadedPageIsAnonymous,
        })}
      >
        {!isAddonInstallPage && !forBlog ? <GetFirefoxBanner /> : null}
        <div className="Header-wrapper">
          <div className="Header-content">
            {isHomePage ? (
              <h1 className="Header-title-wrapper">{headerLink}</h1>
            ) : (
              headerLink
            )}
          </div>

          {clientApp === CLIENT_APP_FIREFOX ? (
            <SectionLinks
              className="Header-SectionLinks"
              location={location}
              forBlog={forBlog}
            />
          ) : null}

          {!forBlog && (
            <>
              <div className="Header-user-and-external-links">
                {otherSiteLinks}

                {this.renderMenuOrAuthButton()}
              </div>
              <SearchForm
                className={makeClassName('Header-search-form', {
                  'Header-search-form--desktop':
                    clientApp === CLIENT_APP_FIREFOX,
                })}
                pathname="/search/"
              />
            </>
          )}
        </div>
      </header>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    api: state.api,
    clientApp: state.api.clientApp,
    isReviewer: hasAnyReviewerRelatedPermission(state),
    loadedPageIsAnonymous: state.site.loadedPageIsAnonymous,
    siteIsReadOnly: state.site.readOnly,
    siteUser: getCurrentUser(state.users),
    userAgentInfo: state.api.userAgentInfo,
  };
};

export const mapDispatchToProps = (dispatch, ownProps) => ({
  handleLogOut: ownProps.handleLogOut || createHandleLogOutFunction(dispatch),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  translate(),
)(HeaderBase);
