import * as React from 'react';
import { shallow } from 'enzyme';

import DefinitionList, { Definition } from 'ui/components/DefinitionList';

describe(__filename, () => {
  describe('DefinitionList component', () => {
    function render(props = {}) {
      return shallow(<DefinitionList {...props} />);
    }

    it('supports a custom class name', () => {
      const root = render({ className: 'MyClass' });
      expect(root).toHaveClassName('MyClass');
      expect(root).toHaveClassName('DefinitionList');
    });

    it('renders children', () => {
      const root = render({
        children: (
          <>
            <Definition className="cool" title="cool">
              Snow
            </Definition>
            <Definition className="hot" title="Hot">
              Beach
            </Definition>
          </>
        ),
      });

      expect(root.find('.DefinitionList').find(Definition)).toHaveLength(2);
      expect(
        root.find('.DefinitionList').find(Definition).at(0).children(),
      ).toHaveText('Snow');
      expect(
        root.find('.DefinitionList').find(Definition).at(1).children(),
      ).toHaveText('Beach');
    });
  });

  describe('Definition component', () => {
    function render(props = {}) {
      return shallow(<Definition {...props} />);
    }

    it('renders a Definition component', () => {
      const root = render({ title: 'hello' });

      expect(root.find('dt')).toHaveProp('className', 'Definition-dt');
      expect(root.find('dd')).toHaveProp('className', 'Definition-dd');
    });

    it('renders className', () => {
      const root = render({ className: 'MyClass' });

      expect(root.find('dd')).toHaveClassName('MyClass');
    });

    it('renders contents', () => {
      const root = render({
        className: 'MyClass',
        children: 'Howdy',
        title: 'hello',
      });

      expect(root.find('dd')).toHaveText('Howdy');
    });

    it('renders term', () => {
      const root = render({ term: 'hello' });

      expect(root.find('dt')).toHaveText('hello');
    });
  });
});
