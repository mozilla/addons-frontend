/* @flow */
import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { compose } from 'redux';
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table';
import 'react-super-responsive-table/src/SuperResponsiveTableStyle.css';

import { setViewContext } from 'amo/actions/viewContext';
import Link from 'amo/components/Link';
import { withErrorHandler } from 'core/errorHandler';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_LANG,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
} from 'core/constants';
import languages from 'core/languages';
import translate from 'core/i18n/translate';
import { fetchLanguageTools } from 'core/reducers/addons';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonState } from 'core/reducers/addons';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type LanguageToolListProps = {|
  addons?: Array<AddonType>,
|};

export const LanguageToolList = ({ addons }: LanguageToolListProps) => {
  if (!addons) {
    return null;
  }

  return (
    <ul className="LanguageTools-addon-list">
      {addons.map((addon) => {
        return (
          <li key={addon.slug}>
            <Link to={`/addon/${addon.slug}/`}>
              {addon.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

type Props = {|
  addons: Array<AddonType>,
  dispatch: Function,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  lang: string,
|};

export class LanguageToolsBase extends React.Component<Props> {
  componentWillMount() {
    const { addons, dispatch, errorHandler } = this.props;

    dispatch(setViewContext(VIEW_CONTEXT_LANGUAGE_TOOLS));
    if (addons === null) {
      dispatch(fetchLanguageTools({ errorHandlerId: errorHandler.id }));
    }
  }

  languageToolsInYourLocale() {
    const { addons, i18n, lang } = this.props;

    const languageToolsInYourLocale = addons ? addons.filter((addon) => {
      return addon.target_locale === lang;
    }) : null;

    // This means we've loaded add-ons but there aren't any available in this
    // user's locale.
    if (
      addons &&
      (!languageToolsInYourLocale || !languageToolsInYourLocale.length)
    ) {
      return null;
    }

    return (
      <div className="LanguageTools-in-your-locale">
        <h2 className="LanguageTools-header">
          {i18n.gettext('Available for your locale')}
        </h2>

        {addons && languageToolsInYourLocale ? (
          <ul className="LanguageTools-in-your-locale-list">
            {languageToolsInYourLocale.map((addon) => {
              return (
                <li
                  className="LanguageTools-in-your-locale-list-item"
                  key={addon.slug}
                >
                  <Link
                    className={
                      `LanguageTools-in-your-locale-list-item--${addon.type}`
                    }
                    to={`/addon/${addon.slug}/`}
                  >
                    {addon.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul>
            <li><LoadingText width={20} /></li>
            <li><LoadingText width={20} /></li>
          </ul>
        )}
      </div>
    );
  }

  render() {
    const { addons, errorHandler, i18n } = this.props;

    const header = i18n.gettext('Dictionaries and Language Packs');

    return (
      <Card
        className="LanguageTools"
        header={header}
      >
        <Helmet>
          <title>{header}</title>
        </Helmet>

        {errorHandler.renderErrorIfPresent()}

        <p>
          {i18n.gettext(`Installing a dictionary add-on will add a new language
            option to your spell-checker, which checks your spelling as you
            type in Firefox.`)}
        </p>
        <p>
          {i18n.gettext(`Language packs change your browser's interface
            language, including menu options and settings.`)}
        </p>

        {this.languageToolsInYourLocale()}

        <h2 className="LanguageTools-header">{i18n.gettext('All Locales')}</h2>

        <Table className="LanguageTools-table">
          <Thead>
            <Tr className="LanguageTools-header-row">
              <Th className="LanguageTools-header-cell LanguageTool-localeName">
                {i18n.gettext('Locale Name')}
              </Th>
              <Th className="LanguageTools-header-cell">
                {i18n.gettext('Language Packs')}
              </Th>
              <Th className="LanguageTools-header-cell">
                {i18n.gettext('Dictionaries')}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {addons && addons.length ? Object.keys(languages).map((langKey) => {
              const toolsInLocale = addons ? addons
                .filter((addon) => {
                  return addon.target_locale === langKey;
                }) : null;

              // This means there are no language tools available in this
              // known locale.
              if (!toolsInLocale || !toolsInLocale.length) {
                return null;
              }

              const dictionaries = toolsInLocale.filter((addon) => {
                return addon.type === ADDON_TYPE_DICT;
              });
              const languagePacks = toolsInLocale.filter((addon) => {
                return addon.type === ADDON_TYPE_LANG;
              });

              return (
                <Tr
                  className={classNames(
                    'LanguageTools-table-row',
                    `LanguageTools-lang-${langKey}`,
                  )}
                  key={langKey}
                >
                  <Td lang={langKey}>
                    {languages[langKey].native}
                  </Td>
                  <Td className={`LanguageTools-lang-${langKey}-languagePacks`}>
                    {languagePacks.length ?
                      <LanguageToolList addons={languagePacks} /> : null}
                  </Td>
                  <Td className={`LanguageTools-lang-${langKey}-dictionaries`}>
                    {dictionaries.length ?
                      <LanguageToolList addons={dictionaries} /> : null}
                  </Td>
                </Tr>
              );
            }) : Array(50).fill(<Tr>
              <Td><LoadingText /></Td>
              <Td><LoadingText /></Td>
              <Td><LoadingText /></Td>
            </Tr>)}
          </Tbody>
        </Table>
      </Card>
    );
  }
}

export const mapStateToProps = (
  state: {|
    addons: AddonState,
    api: Object,
  |}
) => {
  const { addons } = state;
  const languageToolAddons = addons && Object.values(addons).length ?
    Object.values(addons).filter((addon) => {
      // I don't know why we need to check for type but flow complains if we
      // don't. 🤷🏼‍
      return addon && addon.type && (
        addon.type === ADDON_TYPE_DICT || addon.type === ADDON_TYPE_LANG
      );
    }) : null;

  return {
    addons: languageToolAddons && languageToolAddons.length ?
      languageToolAddons : null,
    lang: state.api.lang,
  };
};

export default compose(
  withErrorHandler({ name: 'LanguageTools' }),
  connect(mapStateToProps),
  translate(),
)(LanguageToolsBase);
