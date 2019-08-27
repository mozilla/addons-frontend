import { shallow } from 'enzyme';
import * as React from 'react';

import SecondaryHero from 'amo/components/SecondaryHero';
import { createInternalHeroShelves } from 'amo/reducers/home';
import { createHeroShelves, fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  const createShelfData = (secondaryProps = {}) => {
    return createInternalHeroShelves(
      createHeroShelves({ primaryProps: { addon: fakeAddon }, secondaryProps }),
    ).secondary;
  };

  const render = (moreProps = {}) => {
    const props = {
      shelfData: createShelfData(),
      ...moreProps,
    };
    return shallow(<SecondaryHero {...props} />);
  };

  it('renders a message with a link', () => {
    const cta = { text: 'cta text', url: 'some/url' };
    const description = 'A description';
    const headline = 'A Headline';
    const shelfData = createShelfData({ cta, description, headline });

    const root = render({ shelfData });

    expect(root.find('.SecondaryHero-message-headline')).toHaveText(headline);
    expect(root.find('.SecondaryHero-message-description')).toHaveText(
      description,
    );
    expect(root.find('.SecondaryHero-message-linkText')).toHaveText(cta.text);
    expect(root.find('.SecondaryHero-message-link')).toHaveProp(
      'href',
      cta.url,
    );
  });

  it('renders a message without a link', () => {
    const shelfData = createShelfData({ cta: null });

    const root = render({ shelfData });

    expect(root.find('.SecondaryHero-message-linkText')).toHaveLength(0);
  });

  it('renders modules with and without links', () => {
    const module1 = {
      icon: 'icon1',
      description: 'module1 description',
      cta: { text: 'cta1 text', url: 'cta/url1' },
    };
    const module2 = {
      icon: 'icon2',
      description: 'module2 description',
      cta: null,
    };
    const module3 = {
      icon: 'icon3',
      description: 'module3 description',
      cta: { text: 'cta3 text', url: 'cta/url3' },
    };

    const shelfData = createShelfData({ modules: [module1, module2, module3] });

    const root = render({ shelfData });

    const renderedModules = root.find('.SecondaryHero-module');
    expect(renderedModules).toHaveLength(3);

    const renderedModule1 = renderedModules.at(0);
    expect(renderedModule1.find('.SecondaryHero-module-icon')).toHaveProp(
      'src',
      module1.icon,
    );
    expect(
      renderedModule1.find('.SecondaryHero-module-description'),
    ).toHaveText(module1.description);
    expect(renderedModule1.find('.SecondaryHero-module-linkText')).toHaveText(
      module1.cta.text,
    );
    expect(renderedModule1.find('.SecondaryHero-module-link')).toHaveProp(
      'href',
      module1.cta.url,
    );

    const renderedModule2 = renderedModules.at(1);
    expect(renderedModule2.find('.SecondaryHero-module-icon')).toHaveProp(
      'src',
      module2.icon,
    );
    expect(
      renderedModule2.find('.SecondaryHero-module-description'),
    ).toHaveText(module2.description);
    expect(renderedModule2.find('.SecondaryHero-module-link')).toHaveLength(0);

    const renderedModule3 = renderedModules.at(2);
    expect(renderedModule3.find('.SecondaryHero-module-icon')).toHaveProp(
      'src',
      module3.icon,
    );
    expect(
      renderedModule3.find('.SecondaryHero-module-description'),
    ).toHaveText(module3.description);
    expect(renderedModule3.find('.SecondaryHero-module-linkText')).toHaveText(
      module3.cta.text,
    );
    expect(renderedModule3.find('.SecondaryHero-module-link')).toHaveProp(
      'href',
      module3.cta.url,
    );
  });
});
