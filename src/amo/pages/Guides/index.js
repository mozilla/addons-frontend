/* @flow */
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import ReactMarkdown from 'react-markdown';

import NotFound from 'amo/components/ErrorPage/NotFound';
import { fetchGuideText } from 'amo/reducers/guides';
import Card from 'ui/components/Card';
import translate from 'core/i18n/translate';
import type { GuideTextType } from 'amo/reducers/guides';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import { withFixedErrorHandler } from 'core/errorHandler';

type InternalProps = {|
  guideText: GuideTextType,
  i18n: I18nType,
  match: {
    params: {
      guideSlug: string,
    },
  },
|};

export class GuideBase extends React.Component<InternalProps> {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  };

  render() {
    const { guideText, i18n } = this.props;

    return guideText ? (
      <Card className="StaticPage">
        <Helmet>
          <title>{i18n.gettext('About Firefox Add-ons - Guides')}</title>
        </Helmet>
        <ReactMarkdown source={guideText} />
      </Card>
    ) : (
      <NotFound />
    );
  }
}

export const mapStateToProps = (state: AppState) => {
  return {
    guideText: state.guides.text,
  };
};

export function mapDispatchToProps(
  dispatch: DispatchFunc,
  ownProps: InternalProps,
) {
  const { match } = ownProps;
  const { guideSlug } = match.params;

  dispatch(fetchGuideText({ guideSlug, errorHandlerId: guideSlug }));
}

export const extractId = (ownProps: InternalProps) => {
  return ownProps.match.params.guideSlug;
};

const Guide: React.ComponentType<InternalProps> = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(GuideBase);

export default Guide;
