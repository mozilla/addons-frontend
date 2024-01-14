/* @flow */
import config from 'config';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { CLIENT_APP_ANDROID } from 'amo/constants';
import translate from 'amo/i18n/translate';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import { getCanonicalURL, sanitizeHTML } from 'amo/utils';

import defaultImage from './img/default-og-image.png';

export type DefaultProps = {|
  _config?: typeof config,
  appendDefaultTitle?: boolean,
  withTwitterMeta?: boolean,
|};

export type Props = {|
  ...DefaultProps,
  date?: Date | null,
  description?: string | null,
  image?: string | null,
  lastModified?: string | null,
  queryString?: string,
  title?: string | null,
|};

type PropsFromState = {|
  clientApp: string,
  lang: string,
  locationPathname: string,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
|};

export class HeadMetaTagsBase extends React.PureComponent<InternalProps> {
  static defaultProps: DefaultProps = {
    _config: config,
    appendDefaultTitle: true,
    withTwitterMeta: false,
  };

  getDescription(): string {
    const { description } = this.props;

    return sanitizeHTML(description).__html;
  }

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

    const clientAppType =
      clientApp === CLIENT_APP_ANDROID
        ? i18n.t('Firefox Android')
        : i18n.t('Firefox');

    const baseTitle = i18n.t('Add-ons for %(clientAppType)s (%(locale)s)', {
      locale,
      clientAppType,
    });

    if (!title) return baseTitle;

    if (title && !appendDefaultTitle) return title;

    return `${title} – ${baseTitle}`;
  }

  renderOpenGraph(): Array<React.Node> {
    const { _config, lang, locationPathname, queryString } = this.props;

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

    const description = this.getDescription();

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

  renderTwitter(): null | Array<React.Node> {
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
    const { date, lastModified } = this.props;
    const description = this.getDescription();

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

const mapStateToProps = (state: AppState): PropsFromState => {
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
