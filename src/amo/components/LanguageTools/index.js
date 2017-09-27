import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
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

import './styles.scss';


type PropTypes = {|
  i18n: any,
|};

export class LanguageToolsBase extends React.Component {
  props: PropTypes;

  componentWillMount() {
    const { dispatch, errorHandler } = this.props;

    dispatch(fetchLanguageTools({ errorHandlerId: errorHandler.id }));
    dispatch(setViewContext(VIEW_CONTEXT_LANGUAGE_TOOLS));
  }

  languageTools() {
    return Object.values(this.props.addons).filter((addon) => {
      return addon.type === ADDON_TYPE_DICT || addon.type === ADDON_TYPE_LANG;
    })
  }

  languageToolsInYourLocale() {
    const { i18n, lang } = this.props;

    const languageTools = this.languageTools();
    const languageToolsInYourLocale = languageTools.filter((addon) => {
      return addon.target_locale === lang;
    });

    if (languageTools.length && !languageToolsInYourLocale.length) {
      return null;
    }

    return (
      <div className="LanguageTools-in-your-locale">
        <h2 className="LanguageTools-header">
          {i18n.gettext('Available for your locale')}
        </h2>

        {languageToolsInYourLocale.length ? (
          <ul className="LanguageTools-in-your-locale-list">
            {languageToolsInYourLocale.map((addon) => {
              return (
                <li
                  className="LanguageTools-in-your-locale-list-item"
                  key={addon.url}
                >
                  <Link href={addon.url}>{addon.name}</Link>
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
    const { i18n } = this.props;
    const languageTools = this.languageTools();

    return (
      <Card
        className="LanguageTools"
        header={i18n.gettext('Dictionaries and Language Packs')}
      >
        <p>
          {i18n.gettext(`Installing a dictionary add-on will add a new languag
            option to your spell-checker, which checks your spelling as you
            type in Firefox.`)}
        </p>
        <p>
          {i18n.gettext(`Language pack add-ons change the language of your
            Firefox browser includes menu options and settings.`)}
        </p>

        {this.languageToolsInYourLocale()}

        <h2 className="LanguageTools-header">{i18n.gettext('All Locales')}</h2>

        <Table className="LanguageTools-table">
          <Thead>
            <Tr className="LanguageTools-header-row">
              <Th className="LanguageTools-header-cell">
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
            {languageTools.length ? Object.keys(languages).map((langKey) => {
              const toolsInLocale = languageTools ? languageTools
                .filter((addon) => {
                  return addon.target_locale === langKey;
                }) : null;

              // This means there are no language tools available in this
              // known locale.
              if (languageTools && !toolsInLocale.length) {
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
                  <Td lang={langKey}>{languages[langKey].native}</Td>
                  {languagePacks.length ? (
                    <Td>
                      <ul className="LanguageTools-addon-list">
                        {languagePacks.map((addon) => {
                          return (
                            <li key={addon.url}>
                              <Link href={addon.url}>{addon.name}</Link>
                            </li>
                          );
                        })}
                      </ul>
                    </Td>
                  ) : <Td />}
                  {dictionaries.length ? (
                    <Td>
                      <ul className="LanguageTools-addon-list">
                        {dictionaries.map((addon) => {
                          return (
                            <li key={addon.url}>
                              <Link href={addon.url}>{addon.name}</Link>
                            </li>
                          );
                        })}
                      </ul>
                    </Td>
                  ) : <Td />}
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

export const mapStateToProps = (state) => {
  return {
    addons: state.addons,
    lang: state.api.lang,
  };
}

export default compose(
  withErrorHandler({ name: 'LanguageTools' }),
  connect(mapStateToProps),
  translate(),
)(LanguageToolsBase);
