/* @flow */
/* eslint-disable react/no-danger */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import withUIState from 'amo/withUIState';
import { sanitizeHTML } from 'amo/utils';
import Card from 'amo/components/Card';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

// This refers to height of `Card-contents` CSS class,
// beyond which it will add read more link.
export const DEFAULT_MAX_HEIGHT = 150;

type UIStateType = {|
  showAllContent: boolean,
  readMoreExpanded: boolean,
|};

export const truncateToMaxHeight = ({
  contents,
  maxHeight,
  setUIState,
  uiState,
}: {|
  contents: HTMLElement | null,
  maxHeight: number,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
|}) => {
  if (contents) {
    // If the contents are short enough they don't need a "show more" link; the
    // contents are expanded by default.
    if (uiState.showAllContent && contents.clientHeight >= maxHeight) {
      setUIState({
        ...uiState,
        showAllContent: false,
      });
    }
  }
};

type DefaultProps = {|
  _truncateToMaxHeight: typeof truncateToMaxHeight,
  maxHeight?: number,
|};

type Props = {|
  contentId: number | string | null,
  children: React.Node,
  className?: string,
  header?: React.Node | string,
  id: string,
  maxHeight?: number,
  noStyle?: boolean,
|};

type InternalProps = {|
  _setUIState?: ($Shape<UIStateType>) => void,
  _truncateToMaxHeight: typeof truncateToMaxHeight,
  ...Props,
  i18n: I18nType,
  maxHeight: number,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
|};

const initialUIState: UIStateType = {
  showAllContent: true,
  readMoreExpanded: false,
};

export class ShowMoreCardBase extends React.Component<InternalProps> {
  contents: HTMLElement | null;

  static defaultProps: DefaultProps = {
    _truncateToMaxHeight: truncateToMaxHeight,
    maxHeight: DEFAULT_MAX_HEIGHT,
  };

  componentDidMount() {
    const {
      _setUIState,
      _truncateToMaxHeight,
      maxHeight,
      setUIState,
      uiState,
    } = this.props;
    if (!uiState.readMoreExpanded) {
      _truncateToMaxHeight({
        contents: this.contents,
        maxHeight,
        setUIState: _setUIState || setUIState,
        uiState,
      });
    }
  }

  componentDidUpdate(prevProps: InternalProps) {
    const { contentId: prevContentId } = prevProps;
    const {
      _setUIState,
      _truncateToMaxHeight,
      contentId,
      maxHeight,
      setUIState,
      uiState,
    } = this.props;

    // Reset UIState if component child has changed.
    // This is needed because if you return to an addon that you've already
    // visited the component doesn't hit unmount again and the store keeps the
    // last component's UIState which isn't what we want.
    if (contentId && prevContentId !== contentId) {
      this.resetUIState();
    }

    // If the read more has already been expanded, we can skip the call to
    // truncate.
    // Ideally this would only be called one time and it wouldn't be needed
    // after the initial set up but we need this here (vs componentDidMount) to
    // get an accurate clientHeight.
    if (!uiState.readMoreExpanded) {
      _truncateToMaxHeight({
        contents: this.contents,
        maxHeight,
        setUIState: _setUIState || setUIState,
        uiState,
      });
    }
  }

  resetUIState() {
    this.props.setUIState({
      ...initialUIState,
    });
  }

  onClick: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();

    this.props.setUIState({
      showAllContent: true,
      readMoreExpanded: true,
    });
  };

  render(): React.Node {
    const { children, className, header, id, i18n, uiState, noStyle } =
      this.props;
    const { showAllContent } = uiState;

    invariant(children, 'The children property is required');
    invariant(id, 'The id property is required');

    const readMoreLink = (
      <a
        aria-label={i18n.gettext('Expand to read more')}
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
        noStyle={noStyle}
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

export const extractId = (props: Props): string => {
  return props.id;
};

export default (compose(
  translate(),
  withUIState({
    fileName: __filename,
    extractId,
    initialState: initialUIState,
    resetOnUnmount: true,
  }),
)(ShowMoreCardBase): React.ComponentType<Props>);
