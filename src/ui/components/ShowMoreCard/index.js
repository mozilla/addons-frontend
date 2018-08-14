/* @flow */
/* eslint-disable react/no-danger */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import withUIState from 'core/withUIState';
import { sanitizeHTML } from 'core/utils';
import Card from 'ui/components/Card';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

// This refers to height of `Card-contents` CSS class,
// beyond which it will add read more link.
export const MAX_HEIGHT = 150;

type UIStateType = {|
  expanded: boolean,
|};

type Props = {|
  children: React.Element<any> | string,
  className?: string,
  header?: React.Element<any> | string,
  id: string,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
|};

const initialUIState: UIStateType = { expanded: false };

export class ShowMoreCardBase extends React.Component<InternalProps> {
  contents: HTMLElement | null;

  componentDidMount() {
    this.truncateToMaxHeight(this.contents);
  }

  onClick = (event: SyntheticEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    this.props.setUIState({ expanded: true });
  };

  truncateToMaxHeight = (contents: HTMLElement | null) => {
    // If the contents are short enough they don't need a "show more" link; the
    // contents are expanded by default.
    if (contents) {
      if (contents.clientHeight >= MAX_HEIGHT) {
        this.props.setUIState({ expanded: false });
      } else {
        this.props.setUIState({ expanded: true });
      }
    }
  };

  render() {
    const { children, className, header, id, i18n, uiState } = this.props;
    const { expanded } = uiState;

    invariant(children, 'The children property is required');
    invariant(id, 'The id property is required');

    const readMoreLink = (
      <a
        className="ShowMoreCard-expand-link"
        href="#show-more"
        onClick={this.onClick}
        dangerouslySetInnerHTML={sanitizeHTML(
          i18n.gettext(
            // l10n: The "Expand to" text is for screenreaders so the link
            // makes sense out of context. The HTML makes it hidden from
            // non-screenreaders and must stay.
            '<span class="visually-hidden">Expand to</span> Read more',
          ),
          ['span'],
        )}
      />
    );

    return (
      <Card
        className={makeClassName('ShowMoreCard', className, {
          'ShowMoreCard--expanded': expanded,
        })}
        header={header}
        footerLink={expanded ? null : readMoreLink}
      >
        <div
          className="ShowMoreCard-contents"
          ref={(ref) => {
            this.contents = ref;
          }}
        >
          {children}
        </div>
      </Card>
    );
  }
}

export const extractId = (props: Props) => {
  return props.id;
};

export default compose(
  translate(),
  withUIState({
    fileName: __filename,
    extractId,
    initialState: initialUIState,
  }),
)(ShowMoreCardBase);
