import * as React from 'react';

import MetadataCard from 'amo/components/MetadataCard';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  function render({ metadata = [], ...props } = {}) {
    return defaultRender(<MetadataCard metadata={metadata} {...props} />);
  }

  it('renders metadata', () => {
    const metadata = [
      { content: 'Hello I am content', title: 'I am title' },
      { content: 'I am more content', title: 'I am another title' },
    ];
    render({ metadata });

    const definitions = screen.getAllByRole('definition');
    const terms = screen.getAllByRole('term');
    expect(definitions[0]).toHaveTextContent(metadata[0].content);
    expect(terms[0]).toHaveTextContent(metadata[0].title);
    expect(definitions[1]).toHaveTextContent(metadata[1].content);
    expect(terms[1]).toHaveTextContent(metadata[1].title);
  });

  it('adds a custom className', () => {
    const className = 'MyClassName';
    render({ className });

    expect(screen.getByClassName('MetadataCard')).toHaveClass(className);
  });

  it('requires content', () => {
    expect(() => {
      render({
        metadata: [
          {
            title: 'I am a title',
          },
        ],
      });
    }).toThrow('content is required');
  });

  it('requires a title', () => {
    expect(() => {
      render({
        metadata: [
          {
            content: 'Hello I am content',
          },
        ],
      });
    }).toThrow('title is required');
  });

  it('renders null content as LoadingText', () => {
    const title = 'I am title';
    render({ metadata: [{ content: null, title }] });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('term')).toHaveTextContent(title);
  });

  it('allows an empty string to render empty content', () => {
    const content = '';
    const title = 'I am title';
    render({ metadata: [{ content, title }] });

    expect(screen.getByRole('definition')).toHaveTextContent('');
    expect(screen.getByRole('term')).toHaveTextContent(title);
  });

  it('allows a zero value to render empty content', () => {
    const content = 0;
    const title = 'I am title';
    render({ metadata: [{ content, title }] });

    expect(screen.getByRole('definition')).toHaveTextContent(content);
    expect(screen.getByRole('term')).toHaveTextContent(title);
  });
});
