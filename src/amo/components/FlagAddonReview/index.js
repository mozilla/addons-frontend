/* @flow */
import React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import ListItem from 'ui/components/ListItem';
import TooltipMenu from 'ui/components/TooltipMenu';
import type { I18nType } from 'core/types/i18n';


type Props = {|
  i18n: I18nType,
  openerClass?: string,
  reviewId: number,
|};

export class FlagAddonReviewBase extends React.Component<Props> {
  render() {
    const { i18n, openerClass } = this.props;

    return (
      <TooltipMenu
        idPrefix="flag-review-"
        items={[
          <ListItem key="flag-spam">
            <button>
              {i18n.gettext('This review is spam')}
            </button>
          </ListItem>,
          <ListItem key="flag-language">
            <button>
              {i18n.gettext(
                'This review uses inappropriate language'
              )}
            </button>
          </ListItem>,
          <ListItem key="flag-bug-report">
            <button>
              {i18n.gettext('This is a bug report not a review')}
            </button>
          </ListItem>,
        ]}
        openerClass={openerClass}
        openerText={i18n.gettext('Flag')}
        openerTitle={i18n.gettext('Flag this review')}
      />
    );
  }
}

export default compose(
  translate(),
)(FlagAddonReviewBase);
