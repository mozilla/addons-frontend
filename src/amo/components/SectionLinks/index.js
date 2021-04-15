/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import Link from 'amo/components/Link';
import { setClientApp } from 'amo/reducers/api';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  VIEW_CONTEXT_EXPLORE,
  VIEW_CONTEXT_HOME,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import { visibleAddonType } from 'amo/utils';
import DropdownMenu from 'amo/components/DropdownMenu';
import DropdownMenuItem from 'amo/components/DropdownMenuItem';
import type { AppState } from 'amo/store';
import type { ViewContextType } from 'amo/reducers/viewContext';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterHistoryType } from 'amo/types/router';

import './styles.scss';

type Props = {|
  className?: string,
  withBlogUI?: boolean,
|};

type PropsFromState = {|
  clientApp: string,
  viewContext: ViewContextType,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  i18n: I18nType,
  history: ReactRouterHistoryType,
|};

export class SectionLinksBase extends React.Component<InternalProps> {
  setClientApp: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();

    const { dispatch, history } = this.props;

    const clientApp = event.currentTarget.getAttribute('data-clientapp');
    const href = event.currentTarget.getAttribute('href');

    if (clientApp) {
      dispatch(setClientApp(clientApp));
    }

    if (href) {
      history.push(href);
    }
  };

  render(): React.Node {
    const { className, clientApp, withBlogUI, i18n, viewContext } = this.props;
    const isExploring =
      [VIEW_CONTEXT_EXPLORE, VIEW_CONTEXT_HOME].includes(viewContext) &&
      !withBlogUI;

    let forBrowserNameText;
    if (clientApp === CLIENT_APP_FIREFOX) {
      forBrowserNameText = i18n.gettext('for Firefox');
    } else if (clientApp === CLIENT_APP_ANDROID) {
      forBrowserNameText = i18n.gettext('for Android');
    }

    const sectionsForBrowser = [];

    if (clientApp !== CLIENT_APP_ANDROID) {
      sectionsForBrowser.push(
        <DropdownMenuItem key="dictionaries-and-language-packs">
          <Link
            className={makeClassName('SectionLinks-dropdownlink', {
              'SectionLinks-dropdownlink--active':
                viewContext === VIEW_CONTEXT_LANGUAGE_TOOLS,
            })}
            to="/language-tools/"
          >
            {i18n.gettext('Dictionaries & Language Packs')}
          </Link>
        </DropdownMenuItem>,
      );
    }

    return (
      <ul className={makeClassName('SectionLinks', className)}>
        {withBlogUI && (
          <li>
            <Link
              className={makeClassName(
                'SectionLinks-link',
                'SectionLinks-blog',
                'SectionLinks-link--active',
              )}
              href="/blog/"
              prependClientApp={false}
              prependLang={false}
            >
              {i18n.gettext('Blog')}
            </Link>
          </li>
        )}
        <li>
          <Link
            className={makeClassName(
              'SectionLinks-link',
              'SectionLinks-explore',
              {
                'SectionLinks-link--active': isExploring,
              },
            )}
            to="/"
          >
            {i18n.gettext('Explore')}
          </Link>
        </li>
        <li>
          <Link
            className={makeClassName('SectionLinks-link', {
              'SectionLinks-link--active': viewContext === ADDON_TYPE_EXTENSION,
            })}
            to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`}
          >
            {i18n.gettext('Extensions')}
          </Link>
        </li>
        <li>
          <Link
            className={makeClassName(
              'SectionLinks-link',
              'SectionLinks-link-theme',
              {
                'SectionLinks-link--active':
                  viewContext === ADDON_TYPE_STATIC_THEME,
              },
            )}
            to={`/${visibleAddonType(ADDON_TYPE_STATIC_THEME)}/`}
          >
            {i18n.gettext('Themes')}
          </Link>
        </li>
        {!withBlogUI && (
          <li>
            <DropdownMenu
              className="SectionLinks-link SectionLinks-dropdown"
              text={i18n.gettext('More…')}
            >
              {sectionsForBrowser.length > 0 && (
                <DropdownMenuItem className="SectionLinks-subheader">
                  {forBrowserNameText}
                </DropdownMenuItem>
              )}
              {sectionsForBrowser}

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
        )}
      </ul>
    );
  }
}

function mapStateToProps(state: AppState): PropsFromState {
  return {
    clientApp: state.api.clientApp,
    viewContext: state.viewContext.context,
  };
}

const SectionLinks: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(SectionLinksBase);

export default SectionLinks;
