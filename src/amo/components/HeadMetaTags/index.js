/* @flow */
import config from 'config';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getCanonicalURL } from 'amo/utils';
import { CLIENT_APP_ANDROID } from 'amo/constants';
import translate from 'amo/i18n/translate';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';

import defaultImage from './img/default-og-image.png';

export type Props = {|
  appendDefaultTitle?: boolean,
  date?: Date | null,
  description?: string | null,
  image?: string | null,
  lastModified?: string | null,
  queryString?: string,
  title?: string | null,
  withTwitterMeta?: boolean,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  clientApp: string,
  i18n: I18nType,
  lang: string,
  locationPathname: string,
|};

export class HeadMetaTagsBase extends React.PureComponent<InternalProps> {
  static defaultProps: {|_config: any, appendDefaultTitle: boolean, withTwitterMeta: boolean|} = {
    _config: config,
    appendDefaultTitle: true,
    withTwitterMeta: false,
  };

  getImage(): string {
    const { image } = this.props;

    if (image) {
      return image;
    }

    return defaultImage;
  }

  getTitle(): string {
    const {
      clientApp,
      i18n,
      lang: locale,
      title,
      appendDefaultTitle,
    } = this.props;

    let i18nTitle;
    let i18nValues = { locale };

    if (title) {
      if (!appendDefaultTitle) {
        return title;
      }

      i18nTitle =
        clientApp === CLIENT_APP_ANDROID
          ? i18n.gettext('%(title)s – Add-ons for Firefox Android (%(locale)s)')
          : i18n.gettext('%(title)s – Add-ons for Firefox (%(locale)s)');
      i18nValues = { ...i18nValues, title };
    } else {
      i18nTitle =
        clientApp === CLIENT_APP_ANDROID
          ? i18n.gettext('Add-ons for Firefox Android (%(locale)s)')
          : i18n.gettext('Add-ons for Firefox (%(locale)s)');
    }

    return i18n.sprintf(i18nTitle, i18nValues);
  }

  renderOpenGraph(): Array<React.Element<"meta">> {
    const {
      _config,
      description,
      lang,
      locationPathname,
      queryString,
    } = this.props;

    const url = `${getCanonicalURL({
      _config,
      locationPathname,
    })}${queryString || ''}`;

    const tags = [
      <meta key="og:type" property="og:type" content="website" />,
      <meta key="og:url" property="og:url" content={url} />,
      <meta key="og:title" property="og:title" content={this.getTitle()} />,
      <meta key="og:locale" property="og:locale" content={lang} />,
      <meta key="og:image" property="og:image" content={this.getImage()} />,
    ];

    if (description) {
      tags.push(
        <meta
          key="og:description"
          property="og:description"
          content={description}
        />,
      );
    }

    return tags;
  }

  renderTwitter(): null | Array<React.Element<"meta">> {
    if (!this.props.withTwitterMeta) {
      return null;
    }

    const tags = [
      <meta key="twitter:site" name="twitter:site" content="@mozamo" />,
      <meta
        key="twitter:card"
        name="twitter:card"
        content="summary_large_image"
      />,
    ];

    return tags;
  }

  render(): React.Node {
    const { date, description, lastModified } = this.props;

    return (
      <Helmet>
        {description && <meta name="description" content={description} />}
        {date && <meta name="date" content={date} />}
        {lastModified && <meta name="last-modified" content={lastModified} />}
        {this.renderOpenGraph()}
        {this.renderTwitter()}
      </Helmet>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  const { clientApp, lang } = state.api;
  const { pathname: locationPathname } = state.router.location;

  return {
    clientApp,
    lang,
    locationPathname,
  };
};

const HeadMetaTags: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(HeadMetaTagsBase);

export default HeadMetaTags;
