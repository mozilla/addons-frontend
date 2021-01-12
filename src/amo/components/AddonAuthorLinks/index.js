/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import type { AddonType } from 'amo/types/addons';
import DefinitionList, { Definition } from 'ui/components/DefinitionList';
import type { I18nType } from 'amo/types/i18n';
import type { AppState } from 'amo/store';
import { isAddonAuthor } from 'amo/utils';

type Props = {|
  addon: AddonType | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  currentUserID: number | null,
|};

export class AddonAuthorLinksBase extends React.Component<InternalProps> {
  render() {
    const { addon, i18n, currentUserID } = this.props;

    if (addon === null) {
      return null;
    }

    const isAuthor = isAddonAuthor({ addon, userId: currentUserID });

    if (!isAuthor) {
      return null;
    }

    const editLink = (
      <li>
        <a
          className="AddonAuthorLinks-edit-link"
          href={`/developers/addon/${addon.slug}/edit`}
        >
          {
            // eslint-disable-next-line max-len
            // translators: This action allows the add-on developer to edit an add-on's properties.
            i18n.gettext('Edit add-on')
          }
        </a>
      </li>
    );

    return (
      <DefinitionList className="AddonAuthorLinks">
        <Definition
          term={
            // translators: This is a list of links to Developer functions.
            i18n.gettext('Author Links')
          }
        >
          <ul className="AddonAuthorLinks-list">{editLink}</ul>
        </Definition>
      </DefinitionList>
    );
  }
}

export const mapStateToProps = (state: AppState) => {
  return {
    currentUserID: state.users.currentUserID,
  };
};

const AddonAuthorLinks: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonAuthorLinksBase);

export default AddonAuthorLinks;
