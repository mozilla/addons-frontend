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
  showAllContent: boolean,
  disableTruncateCall: boolean,
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

const initialUIState: UIStateType = {
  showAllContent: true,
  disableTruncateCall: false,
};

export class ShowMoreCardBase extends React.Component<InternalProps> {
  contents: HTMLElement | null;

  onClick = (event: SyntheticEvent<HTMLAnchorElement>) => {
    const { setUIState } = this.props;

    event.preventDefault();

    setUIState({ showAllContent: true });

    // This is used to prevent any additional
    // unnecessary calls to the truncate function.
    setUIState({ disableTruncateCall: true });
  };

  componentWillReceiveProps(nextProps: InternalProps) {
    // Once read more has been clicked, the card has been opened so we no longer
    // have to run this truncate for the component.
    if (!this.props.uiState.disableTruncateCall) {
      this.truncateToMaxHeight(this.contents);
    }
  }

  truncateToMaxHeight = (contents: HTMLElement | null) => {
    if (contents) {
      // If the contents are short enough they don't need a "show more" link; the
      // contents are expanded by default.
      if (
        this.props.uiState.showAllContent &&
        contents.clientHeight >= MAX_HEIGHT
      ) {
        this.props.setUIState({ showAllContent: false });
      }
    }
  };

  render() {
    const { children, className, header, id, i18n, uiState } = this.props;
    const { showAllContent } = uiState;

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
          'ShowMoreCard--expanded': showAllContent,
        })}
        header={header}
        footerLink={showAllContent ? null : readMoreLink}
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
    resetOnUnmount: true,
  }),
)(ShowMoreCardBase);
