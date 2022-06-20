import { waitFor } from '@testing-library/react';

import {
  getElement,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render({ location }) {
    return defaultRender({ initialEntries: [location] });
  }

  it('outputs the about page', () => {
    render({ location: '/en-US/about' });

    expect(screen.getByText('About Firefox Add-ons')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'A community of creators' }),
    ).toBeInTheDocument();
  });

  it('outputs the review guide page', () => {
    render({ location: '/en-US/review_guide' });

    expect(screen.getByText('Review Guidelines')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Frequently Asked Questions about Reviews',
      }),
    ).toBeInTheDocument();
  });

  describe('Tests for StaticPage component', () => {
    it('renders a StaticPage Component', async () => {
      render({ location: '/en-US/about' });

      await waitFor(() => {
        expect(getElement('meta[name="description"]')).toHaveAttribute(
          'content',
          `The official Mozilla site for downloading Firefox extensions and ` +
            `themes. Add new features and change the browser’s appearance to ` +
            `customize your web experience.`,
        );
      });

      expect(getElement('title')).toHaveTextContent(
        'About Firefox Add-ons – Add-ons for Firefox Android (en-US)',
      );
      expect(getElement('link[rel="canonical"]')).toBeInTheDocument();
    });
  });
});
