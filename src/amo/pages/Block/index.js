/* @flow */
import Helmet from 'react-helmet';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Page from 'amo/components/Page';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import { fetchBlock } from 'amo/reducers/blocks';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterMatchType } from 'core/types/router';
import type { BlockType } from 'amo/reducers/blocks';

import './styles.scss';

type Props = {|
  match: {
    ...ReactRouterMatchType,
    params: {| guid: string |},
  },
|};

type InternalProps = {|
  ...Props,
  block: BlockType | void | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

const CRITERIA_URL =
  'https://extensionworkshop.com/documentation/publish/add-ons-blocking-process/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=blocked-addon';
const POLICIES_URL =
  'https://extensionworkshop.com/documentation/publish/add-on-policies/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=blocked-addon';
const SUPPORT_URL =
  'https://support.mozilla.org/kb/add-ons-cause-issues-are-on-blocklist';

export class BlockBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const {
      block,
      dispatch,
      errorHandler,
      match: {
        params: { guid },
      },
    } = this.props;

    if (block === undefined) {
      dispatch(fetchBlock({ errorHandlerId: errorHandler.id, guid }));
    }
  }

  renderReason() {
    const { block } = this.props;

    if (block && block.reason === null) {
      // Do not render a paragraph when it is not needed.
      return null;
    }

    return (
      <p className="Block-reason">{block ? block.reason : <LoadingText />}</p>
    );
  }

  renderDateAndURL() {
    const { block, i18n } = this.props;

    if (!block) {
      return <LoadingText />;
    }

    const content = [
      i18n.sprintf(i18n.gettext('Blocked on %(date)s.'), {
        date: i18n.moment(block.created).format('ll'),
      }),
    ];

    if (block.url) {
      content.push(
        ' ',
        <a key={block.url} href={block.url}>
          {i18n.gettext('View block request')}
        </a>,
        '.',
      );
    }

    return content;
  }

  render() {
    const { block, i18n } = this.props;

    if (block === null) {
      return <NotFoundPage />;
    }

    const title = i18n.gettext(`This add-on has been blocked for your
      protection.`);

    return (
      <Page>
        <div className="Block-page">
          <Helmet>
            <title>{title}</title>
          </Helmet>

          <Card className="Block-content" header={title}>
            <h2>{i18n.gettext('Why was it blocked?')}</h2>
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(`This add-on violates %(startLink)sMozilla's
                    Add-on Policies%(endLink)s.`),
                  {
                    startLink: `<a href="${POLICIES_URL}">`,
                    endLink: '</a>',
                  },
                ),
                ['a'],
              )}
            />
            {this.renderReason()}

            <h2>{i18n.gettext('What does this mean?')}</h2>
            <p>
              {i18n.gettext(`The problematic add-on or plugin will be
                automatically disabled and no longer usable.`)}
            </p>
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(`When Mozilla becomes aware of add-ons, plugins,
                    or other third-party software that seriously compromises
                    Firefox security, stability, or performance and meets
                    %(criteriaStartLink)scertain criteria%(criteriaEndLink)s,
                    the software may be blocked from general use. For more
                    information, please read %(supportStartLink)sthis support
                    article%(supportEndLink)s.`),
                  {
                    criteriaStartLink: `<a href="${CRITERIA_URL}">`,
                    criteriaEndLink: '</a>',
                    supportStartLink: `<a href="${SUPPORT_URL}">`,
                    supportEndLink: '</a>',
                  },
                ),
                ['a'],
              )}
            />
            <p className="Block-metadata">
              {block ? (
                i18n.sprintf(
                  i18n.gettext('Versions blocked: %(min)s to %(max)s.'),
                  {
                    min: block.min_version,
                    max: block.max_version,
                  },
                )
              ) : (
                <LoadingText />
              )}
              <br />
              {this.renderDateAndURL()}
            </p>
          </Card>
        </div>
      </Page>
    );
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: InternalProps,
): $Shape<InternalProps> => {
  const { blocks } = state;

  return {
    block: blocks.blocks[ownProps.match.params.guid],
  };
};

export const extractId = (ownProps: InternalProps) => {
  return ownProps.match.params.guid;
};

const Block: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(BlockBase);

export default Block;
