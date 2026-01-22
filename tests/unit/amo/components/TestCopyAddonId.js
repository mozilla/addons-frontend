/* global navigator */
import * as React from 'react';
import userEvent from '@testing-library/user-event';

import CopyAddonId from 'amo/components/CopyAddonId';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  const SOME_ADDON_ID = 'some-addon-id';

  const render = ({ addonId = SOME_ADDON_ID } = {}) => {
    return defaultRender(<CopyAddonId addonId={addonId} />);
  };

  let writeText;

  beforeEach(() => {
    writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('renders a link with the copy text', () => {
    render();

    expect(screen.getByRole('link', { name: 'Copy add-on ID' })).toHaveClass(
      'CopyAddonId',
    );
    expect(screen.queryByText('Add-on ID copied')).not.toBeInTheDocument();
  });

  it('writes the addonId to the clipboard when clicked', async () => {
    render({ addonId: 'my-guid@example.com' });

    await userEvent.click(screen.getByRole('link', { name: 'Copy add-on ID' }));

    expect(writeText).toHaveBeenCalledWith('my-guid@example.com');
    expect(screen.getByText('Add-on ID copied')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Copy add-on ID' }),
    ).not.toBeInTheDocument();
  });
});
