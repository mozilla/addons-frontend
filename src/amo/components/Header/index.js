import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import Link from 'amo/components/Link';
import SearchForm from 'amo/components/SearchForm';
// import SectionLinks from 'amo/components/SectionLinks';
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
    minimal: PropTypes.bool,
    SearchFormComponent: PropTypes.node.isRequired,
    query: PropTypes.string,
  }

  static defaultPropTypes = {
    SearchFormComponent: SearchForm,
    isHomePage: false,
    minimal: false,
  }

  render() {
    const {
      SearchFormComponent,
      i18n,
      isHomePage,
      lang,
      location,
      query,
    } = this.props;
    const headerLink = (
      <Link className="Header-title" to="/">
        <Icon className="Header-addons-icon" name="extensions-complex" />
        {i18n.gettext('Firefox Add-ons')}
      </Link>
    );

    return (
      <div className="Header">
        <div className="Header-top-row">
          <div className="Header-buttons">
            {/*
              We don't use the Link component here because we only want to
              include the locale in the URL, not the clientApp.
            */}
            <Button
              base=""
              className="Header-developer-hub-link"
              href={`/${lang}/developers/`}
              inverse={true}
              prefix={false}
              size="small"
              type="action"
            >
              {i18n.gettext('Developer Hub')}
            </Button>
            <AuthenticateButton
              className="Header-auth-button"
              location={location}
              noIcon={true}
              size="small"
              type="action"
            />
          </div>
        </div>
        <header className="Header-content">
          {isHomePage
            ? <h1 className="Header-title-wrapper">{headerLink}</h1>
            : headerLink}
        </header>
        {/*
        <SectionLinks location={location} />
        */}
        <SearchFormComponent pathname="/search/" query={query} />
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return { lang: state.api.lang };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(HeaderBase);
