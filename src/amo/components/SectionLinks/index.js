/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import Link from 'amo/components/Link';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import { visibleAddonType } from 'amo/utils';
import DropdownMenu from 'amo/components/DropdownMenu';
import DropdownMenuItem from 'amo/components/DropdownMenuItem';
import type { AppState } from 'amo/store';
import type { ViewContextType } from 'amo/reducers/viewContext';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  className?: string,
  forBlog?: boolean,
|};

type PropsFromState = {|
  clientApp: string,
  viewContext: ViewContextType,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
|};

export class SectionLinksBase extends React.Component<InternalProps> {
  render(): React.Node {
    const { className, clientApp, forBlog, i18n, viewContext } = this.props;

    // These SectionLinks should only be included when clientApp is Firefox.
    invariant(
      clientApp === CLIENT_APP_FIREFOX,
      'SectionLinks included when clientApp is not Firefox',
    );

    const linkProps = {
      prependClientApp: !forBlog,
      prependLang: !forBlog,
    };

    return (
      <ul className={makeClassName('SectionLinks', className)}>
        <li>
          <Link
            className={makeClassName(
              'SectionLinks-link',
              'SectionLinks-link-extension',
              {
                'SectionLinks-link--active':
                  viewContext === ADDON_TYPE_EXTENSION,
              },
            )}
            to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`}
            {...linkProps}
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
            {...linkProps}
          >
            {i18n.gettext('Themes')}
          </Link>
        </li>
        <li>
          <DropdownMenu
            className="SectionLinks-link SectionLinks-dropdown"
            text={i18n.gettext('More…')}
          >
            <>
              <DropdownMenuItem className="SectionLinks-subheader">
                {i18n.gettext('for Firefox')}
              </DropdownMenuItem>
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
              </DropdownMenuItem>
            </>
          </DropdownMenu>
        </li>
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
  connect(mapStateToProps),
  translate(),
)(SectionLinksBase);

export default SectionLinks;
