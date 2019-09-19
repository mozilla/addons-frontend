import { shallow } from 'enzyme';
import * as React from 'react';

import SecondaryHero, {
  SECONDARY_HERO_SRC,
} from 'amo/components/SecondaryHero';
import { createInternalHeroShelves } from 'amo/reducers/home';
import { addParamsToHeroURL } from 'amo/utils';
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
      addParamsToHeroURL({
        heroSrcCode: SECONDARY_HERO_SRC,
        urlString: cta.url,
      }),
    );
  });

  it('renders a message without a link', () => {
    const shelfData = createShelfData({ cta: null });

    const root = render({ shelfData });

    expect(root.find('.SecondaryHero-message-linkText')).toHaveLength(0);
  });

  it('configures an external link to open in a new tab', () => {
    const _isInternalURL = sinon.stub().returns(false);
    const cta = { text: 'cta text', url: 'some/url' };
    const shelfData = createShelfData({ cta });

    const root = render({ _isInternalURL, shelfData });

    const link = root.find('.SecondaryHero-message-link');
    expect(link).toHaveProp('rel', 'noopener noreferrer');
    expect(link).toHaveProp('target', '_blank');
    sinon.assert.calledWith(
      _isInternalURL,
      sinon.match({ urlString: sinon.match(cta.url) }),
    );
  });

  it('does not configure an internal link to open in a new tab', () => {
    const _isInternalURL = sinon.stub().returns(true);
    const cta = { text: 'cta text', url: 'some/url' };
    const shelfData = createShelfData({ cta });

    const root = render({ _isInternalURL, shelfData });

    const link = root.find('.SecondaryHero-message-link');
    expect(link).not.toHaveProp('rel', 'noopener noreferrer');
    expect(link).not.toHaveProp('target', '_blank');
    sinon.assert.calledWith(
      _isInternalURL,
      sinon.match({ urlString: sinon.match(cta.url) }),
    );
  });

  describe('modules', () => {
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

    const shelfData = createShelfData({
      modules: [module1, module2, module3],
    });

    it('renders all of the modules', () => {
      const root = render({ shelfData });

      const renderedModules = root.find('.SecondaryHero-module');
      expect(renderedModules).toHaveLength(3);
    });

    it.each([[0, module1], [1, module2], [2, module3]])(
      'renders the module at position "%s"',
      (moduleIndex, moduleData) => {
        const root = render({ shelfData });

        const module = root.find('.SecondaryHero-module').at(moduleIndex);
        expect(module.find('.SecondaryHero-module-icon')).toHaveProp(
          'src',
          moduleData.icon,
        );
        expect(module.find('.SecondaryHero-module-description')).toHaveText(
          moduleData.description,
        );
        expect(module.find('.SecondaryHero-module-link')).toHaveLength(
          moduleData.cta ? 1 : 0,
        );
        if (moduleData.cta) {
          expect(module.find('.SecondaryHero-module-linkText')).toHaveText(
            moduleData.cta.text,
          );
          expect(module.find('.SecondaryHero-module-link')).toHaveProp(
            'href',
            addParamsToHeroURL({
              heroSrcCode: SECONDARY_HERO_SRC,
              urlString: moduleData.cta.url,
            }),
          );
        }
      },
    );

    it('configures an external link to open in a new tab', () => {
      const _isInternalURL = sinon.stub().returns(false);

      const root = render({ _isInternalURL, shelfData });

      const link = root.find('.SecondaryHero-module-link').at(0);
      expect(link).toHaveProp('rel', 'noopener noreferrer');
      expect(link).toHaveProp('target', '_blank');
      sinon.assert.calledWith(
        _isInternalURL,
        sinon.match({ urlString: sinon.match(module1.cta.url) }),
      );
    });

    it('does not configure an internal link to open in a new tab', () => {
      const _isInternalURL = sinon.stub().returns(true);

      const root = render({ _isInternalURL, shelfData });

      const link = root.find('.SecondaryHero-module-link').at(0);
      expect(link).not.toHaveProp('rel', 'noopener noreferrer');
      expect(link).not.toHaveProp('target', '_blank');
      sinon.assert.calledWith(
        _isInternalURL,
        sinon.match({ urlString: sinon.match(module1.cta.url) }),
      );
    });
  });
});
