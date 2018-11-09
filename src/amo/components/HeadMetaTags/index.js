/* @flow */
import config from 'config';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getCanonicalURL } from 'amo/utils';
import type { AppState } from 'amo/store';

type Props = {|
  date?: Date | null,
  description: string,
  image?: string | null,
  lastModified?: Date | null,
  title: string,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  lang: string,
  locationPathname: string,
|};

export class HeadMetaTagsBase extends React.PureComponent<InternalProps> {
  renderOpenGraph() {
    const {
      _config,
      description,
      image,
      lang,
      locationPathname,
      title,
    } = this.props;

    const tags = [
      <meta key="og:type" property="og:type" content="website" />,
      <meta
        key="og:url"
        property="og:url"
        content={getCanonicalURL({ _config, locationPathname })}
      />,
      <meta key="og:title" property="og:title" content={title} />,
      <meta
        key="og:description"
        property="og:description"
        content={description}
      />,
      <meta key="og:locale" property="og:locale" content={lang} />,
    ];

    if (image) {
      tags.push(<meta key="og:image" property="og:image" content={image} />);
    }

    return tags;
  }

  render() {
    const { date, description, lastModified } = this.props;

    return (
      <Helmet>
        <meta name="description" content={description} />
        {date && <meta name="date" content={date} />}
        {lastModified && <meta name="last-modified" content={lastModified} />}
        {this.renderOpenGraph()}
      </Helmet>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  const { lang } = state.api;
  const { pathname: locationPathname } = state.router.location;

  return {
    lang,
    locationPathname,
  };
};

const HeadMetaTags: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
)(HeadMetaTagsBase);

export default HeadMetaTags;
