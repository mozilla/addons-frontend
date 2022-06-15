import * as React from 'react';

import DefinitionList, { Definition } from 'amo/components/DefinitionList';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  function renderDefinitionList(props = {}) {
    return defaultRender(<DefinitionList {...props} />);
  }

  const getDefinitionList = () => screen.getByTagName('dl');
  const getTerms = () => screen.getAllByRole('term');
  const getDefinitions = () => screen.getAllByRole('definition');
  const getTerm = () => getTerms()[0];
  const getDefinition = () => getDefinitions()[0];

  describe('DefinitionList component', () => {
    it('supports a custom class name', () => {
      renderDefinitionList({ className: 'MyClass' });

      const dl = getDefinitionList();

      expect(dl).toHaveClass('MyClass');
      expect(dl).toHaveClass('DefinitionList');
    });

    it('renders children', () => {
      renderDefinitionList({
        children: (
          <>
            <Definition className="cool">Snow</Definition>
            <Definition className="hot">Beach</Definition>
          </>
        ),
      });

      const terms = getTerms();
      const definitions = getDefinitions();

      expect(terms).toHaveLength(2);
      expect(definitions).toHaveLength(2);

      expect(definitions[0]).toHaveTextContent('Snow');
      expect(definitions[1]).toHaveTextContent('Beach');
    });
  });

  describe('Definition component', () => {
    function render(props = {}) {
      return renderDefinitionList({ children: <Definition {...props} /> });
    }

    it('renders a Definition component', () => {
      render();

      expect(getTerm()).toHaveClass('Definition-dt');
      expect(getDefinition()).toHaveClass('Definition-dd');
    });

    it('renders className', () => {
      const className = 'MyClass';
      render({ className });

      expect(getDefinition()).toHaveClass(className);
    });

    it('renders contents', () => {
      const children = 'Howdy';
      render({ children });

      expect(getDefinition()).toHaveTextContent(children);
    });

    it('renders term', () => {
      const term = 'hello';
      render({ term });

      expect(getTerm()).toHaveTextContent(term);
    });
  });
});
