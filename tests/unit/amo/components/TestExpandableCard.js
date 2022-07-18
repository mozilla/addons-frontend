import * as React from 'react';
import defaultUserEvent from '@testing-library/user-event';

import ExpandableCard, { extractId } from 'amo/components/ExpandableCard';
import {
  dispatchClientMetadata,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = ({ children, id = 'some-id', ...props } = {}) => {
    return defaultRender(
      <ExpandableCard id={id} {...props}>
        {children || 'some info'}
      </ExpandableCard>,
      { store },
    );
  };

  const getCard = () => screen.getByTagName('section');

  it('is unexpanded by default', () => {
    render();

    expect(getCard()).not.toHaveClass('ExpandableCard--expanded');
  });

  it('toggles when clicked', async () => {
    render();
    const userEvent = defaultUserEvent.setup();

    // This toggles to make expanded true.
    await userEvent.click(screen.getByRole('switch'));
    expect(getCard()).toHaveClass('ExpandableCard--expanded');

    // This toggles to make expanded false.
    await userEvent.click(screen.getByRole('switch'));
    expect(getCard()).not.toHaveClass('ExpandableCard--expanded');
  });

  it('renders with a className', () => {
    const className = 'MyClass';
    render({ className });

    expect(getCard()).toHaveClass(className);
  });

  it('renders children', () => {
    const children = 'Hello I am description';
    render({ children });

    expect(screen.getByText(children)).toBeInTheDocument();
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the ID prop', () => {
      const id = 'custom-card-id';
      expect(extractId({ id })).toEqual(id);
    });
  });
});
