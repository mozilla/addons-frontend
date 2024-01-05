/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import DefinitionList, { Definition } from 'amo/components/DefinitionList';
import { isAddonAuthor } from 'amo/utils';
import type { UserId } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import type { AddonType } from 'amo/types/addons';

type Props = {|
  addon: AddonType | null,
|};

type PropsFromState = {|
  currentUserID: null | UserId,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
|};

export class AddonAuthorLinksBase extends React.Component<InternalProps> {
  render(): null | React.Node {
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
            // L10n: This action allows the add-on developer to edit an add-on's properties.
            i18n.gettext('Edit add-on')
          }
        </a>
      </li>
    );

    return (
      <DefinitionList className="AddonAuthorLinks">
        <Definition
          term={
            // L10n: This is a list of links to Developer functions.
            i18n.gettext('Author Links')
          }
        >
          <ul className="AddonAuthorLinks-list">{editLink}</ul>
        </Definition>
      </DefinitionList>
    );
  }
}

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    currentUserID: state.users.currentUserID,
  };
};

const AddonAuthorLinks: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonAuthorLinksBase);

export default AddonAuthorLinks;
