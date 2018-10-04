/* @flow */
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import * as React from 'react';
import { compose } from 'redux';
import ReactMarkdown from 'react-markdown';

import NotFound from 'amo/components/ErrorPage/NotFound';
import log from 'core/logger';
import Card from 'ui/components/Card';
import translate from 'core/i18n/translate';
import type { I18nType } from 'core/types/i18n';

type InternalProps = {|
  i18n: I18nType,
  match: {
    params: {
      guideSlug: string,
    },
  },
|};

type State = {|
  guideText: string | null,
|};

export class GuideBase extends React.Component<InternalProps, State> {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  };

  constructor(props: InternalProps) {
    super(props);

    this.state = {
      guideText: '',
    };

    this.getText();
  }

  async getText() {
    const { match } = this.props;
    const { guideSlug } = match.params;

    try {
      // $FLOW_FIXME: This is a temp fix. If we go this route, I will look into fixing.
      const text = await import(`amo/guides/${guideSlug}.md`);
      this.setState({
        guideText: text,
      });
    } catch (err) {
      this.setState({
        guideText: null,
      });
      log.warn(`There was an error with the ${guideSlug} file: ${err}`);
    }
  }

  render() {
    const { i18n } = this.props;
    const { guideText } = this.state;

    // TODO: fix flash.
    return typeof guideText === 'string' ? (
      <Card header={i18n.gettext('About Firefox Add-ons')}>
        <Helmet>
          <title>{i18n.gettext('About Firefox Add-ons')}</title>
        </Helmet>
        <ReactMarkdown source={guideText} />
      </Card>
    ) : (
      <NotFound />
    );
  }
}

export default compose(translate())(GuideBase);
