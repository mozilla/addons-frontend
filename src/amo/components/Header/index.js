import React, { PropTypes } from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import SearchForm from 'amo/components/SearchForm';
import SectionLinks from 'amo/components/SectionLinks';
import AuthenticateButton from 'core/components/AuthenticateButton';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';

import 'mozilla-tabzilla/css/_tabzilla.scss';
import './styles.scss';


export class HeaderBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    isHomePage: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    SearchFormComponent: PropTypes.node.isRequired,
    query: PropTypes.string,
  }

  static defaultPropTypes = {
    SearchFormComponent: SearchForm,
    isHomePage: false,
  }

  render() {
    const {
      SearchFormComponent,
      i18n,
      isHomePage,
      location,
      query,
    } = this.props;
    const headerLink = (
      <Link className="Header-title" to="/">
        <Icon className="Header-addons-icon" name="fox-light" />
        {
          // l10n: "Firefox" should not be translated. :-)
          i18n.gettext('Firefox Add-ons')
        }
      </Link>
    );

    return (
      <header className="Header">
        <div className="Header-top-row">
          <div className="Header-buttons">
            <Button
              className="Header-developer-hub-link
                Button--action Button--outline-only Button--small"
              href="/developers/"
              prependClientApp={false}
            >
              {i18n.gettext('Developer Hub')}
            </Button>
            <AuthenticateButton
              className="Header-auth-button Button--action Button--small"
              location={location}
              noIcon
            />
          </div>
        </div>
        <div className="Header-content">
          {isHomePage
            ? <h1 className="Header-title-wrapper">{headerLink}</h1>
            : headerLink}
        </div>
        <SectionLinks location={location} />
        <SearchFormComponent pathname="/search/" query={query} />
      </header>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(HeaderBase);
