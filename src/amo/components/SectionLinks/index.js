/* @flow */
import classNames from 'classnames';
import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Link from 'amo/components/Link';
import { setClientApp } from 'core/actions';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  VIEW_CONTEXT_EXPLORE,
  VIEW_CONTEXT_HOME,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { visibleAddonType } from 'core/utils';
import DropdownMenu from 'ui/components/DropdownMenu';
import DropdownMenuItem from 'ui/components/DropdownMenuItem';
import type { ViewContextType } from 'amo/reducers/viewContext';
import type { ApiStateType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  className?: string,
  clientApp: string,
  dispatch: Function,
  i18n: I18nType,
  router: Object,
  viewContext: ViewContextType,
|};

export class SectionLinksBase extends React.Component<Props> {
  setClientApp = (event: Object) => {
    event.preventDefault();

    const { dispatch, router } = this.props;

    const clientApp = event.currentTarget.getAttribute('data-clientapp');

    dispatch(setClientApp(clientApp));
    router.push(event.currentTarget.getAttribute('href'));
  }

  render() {
    const { className, clientApp, i18n, viewContext } = this.props;
    const isExploring = [VIEW_CONTEXT_EXPLORE, VIEW_CONTEXT_HOME]
      .includes(viewContext);

    let forBrowserNameText;
    if (clientApp === CLIENT_APP_FIREFOX) {
      forBrowserNameText = i18n.gettext('for Firefox');
    } else if (clientApp === CLIENT_APP_ANDROID) {
      forBrowserNameText = i18n.gettext('for Android');
    }

    return (
      <ul className={classNames('SectionLinks', className)}>
        <li>
          <Link
            className={classNames('SectionLinks-link', 'SectionLinks-explore', {
              'SectionLinks-link--active': isExploring,
            })}
            to="/"
          >
            {i18n.gettext('Explore')}
          </Link>
        </li>
        <li>
          <Link
            className={classNames('SectionLinks-link', {
              'SectionLinks-link--active': viewContext ===
                ADDON_TYPE_EXTENSION,
            })}
            to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`}
          >
            {i18n.gettext('Extensions')}
          </Link>
        </li>
        <li>
          <Link
            className={classNames('SectionLinks-link', {
              'SectionLinks-link--active': viewContext === ADDON_TYPE_THEME,
            })}
            to={`/${visibleAddonType(ADDON_TYPE_THEME)}/`}
          >
            {i18n.gettext('Themes')}
          </Link>
        </li>
        <li>
          <DropdownMenu
            className="SectionLinks-link SectionLinks-dropdown"
            text={i18n.gettext('More…')}
          >
            <DropdownMenuItem className="SectionLinks-subheader">
              {forBrowserNameText}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                className={classNames('SectionLinks-dropdownlink', {
                  'SectionLinks-dropdownlink--active': viewContext ===
                    VIEW_CONTEXT_LANGUAGE_TOOLS,
                })}
                to="/language-tools/"
              >
                {i18n.gettext('Dictionaries & Language Packs')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                className="SectionLinks-dropdownlink"
                href="/search-tools/"
              >
                {i18n.gettext('Search Tools')}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="SectionLinks-subheader">
              {i18n.gettext('Other Browser Sites')}
            </DropdownMenuItem>
            {clientApp !== CLIENT_APP_ANDROID ? (
              <DropdownMenuItem>
                <Link
                  className={`SectionLinks-clientApp-${CLIENT_APP_ANDROID}`}
                  data-clientapp={CLIENT_APP_ANDROID}
                  onClick={this.setClientApp}
                  prependClientApp={false}
                  to={`/${CLIENT_APP_ANDROID}/`}
                >
                  {i18n.gettext('Add-ons for Android')}
                </Link>
              </DropdownMenuItem>
            ) : null}
            {clientApp !== CLIENT_APP_FIREFOX ? (
              <DropdownMenuItem>
                <Link
                  className={`SectionLinks-clientApp-${CLIENT_APP_FIREFOX}`}
                  data-clientapp={CLIENT_APP_FIREFOX}
                  onClick={this.setClientApp}
                  prependClientApp={false}
                  to={`/${CLIENT_APP_FIREFOX}/`}
                >
                  {i18n.gettext('Add-ons for Firefox')}
                </Link>
              </DropdownMenuItem>
            ) : null}
          </DropdownMenu>
        </li>
      </ul>
    );
  }
}

export function mapStateToProps(
  state: {
    api: ApiStateType,
    viewContext: ViewContextType,
  }
) {
  return {
    clientApp: state.api.clientApp,
    viewContext: state.viewContext.context,
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(SectionLinksBase);
