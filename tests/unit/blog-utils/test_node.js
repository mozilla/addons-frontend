/**
 * @jest-environment node
 */
import { buildFooter } from 'blog-utils';

describe(__filename, () => {
  // This test runs in a `node` environment (see the docblock above) so that
  // there is no DOM, like when blog-utils is used server-side. We use a memory
  // history rather than a browser history, which would otherwise throw a
  // "Browser history needs a DOM" error when rendering without a DOM.
  it('renders without a DOM', () => {
    expect(() => buildFooter()).not.toThrow();
  });
});
