/* global window */
import * as React from 'react';
import userEvent from '@testing-library/user-event';

import ScreenShots from 'amo/components/ScreenShots';
import { render as defaultRender, screen } from 'tests/unit/helpers';

const HEIGHT = 400;
const WIDTH = 200;

// See: https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe(__filename, () => {
  const testPreviews = [
    {
      title: 'A screenshot',
      src: 'http://img.com/one',
      thumbnail_src: 'http://img.com/1',
      thumbnail_w: WIDTH - 100,
      thumbnail_h: HEIGHT - 100,
      h: HEIGHT,
      w: WIDTH,
    },
    {
      title: 'Another screenshot',
      src: 'http://img.com/two',
      thumbnail_src: 'http://img.com/2',
      thumbnail_w: WIDTH - 100,
      thumbnail_h: HEIGHT - 100,
      h: HEIGHT,
      w: WIDTH,
    },
  ];

  const render = (previews = testPreviews) =>
    defaultRender(<ScreenShots previews={previews} />);

  it('renders the previews', async () => {
    render();

    const imgs = Array.from(screen.getAllByTagName('img'));
    expect(imgs).toHaveLength(testPreviews.length);

    imgs.forEach((preview, index) => {
      expect(preview).toHaveAttribute('src', testPreviews[index].thumbnail_src);
      expect(preview).toHaveAttribute(
        'width',
        testPreviews[index].thumbnail_w.toString(),
      );
      expect(preview).toHaveAttribute(
        'height',
        testPreviews[index].thumbnail_h.toString(),
      );
      expect(preview).toHaveAttribute('alt', testPreviews[index].title);
    });

    await userEvent.click(screen.getByAltText(testPreviews[0].title));

    expect(screen.getByText(testPreviews[0].title)).toBeInTheDocument();
  });

  // eslint-disable-next-line jest/no-commented-out-tests
  /*

  I cannot seem to get this test to work. Looking at the debug output,
  I'm not sure if the escape key is closing the dialog or not, but I
  would have expected unmount to fire the onClose event at least.

  No matter what I try I cannot get the scrollLeft spy to report
  having been called.

  Commenting this out for now.
  See https://github.com/mozilla/addons-frontend/issues/11482.

  it('scrolls to the active item on close', async () => {
    const { unmount } = render();

    // eslint-disable-next-line testing-library/no-node-access
    const list = document.querySelector('.ScreenShots-list');
    const scrollLeft = jest.spyOn(list, 'scrollLeft', 'set');

    // This clicks the Escape key.
    fireEvent.keyDown(screen.getByAltText(testPreviews[0].title), {
      key: 'Escape',
      keyCode: 27,
      which: 27,
    });
    await userEvent.click(screen.getByAltText(testPreviews[0].title));
    await userEvent.keyboard('[Escape]');
    await userEvent.keyboard('{esc}');
    unmount();

    await waitFor(() => expect(scrollLeft).toHaveBeenCalled());
  });
  */
});
