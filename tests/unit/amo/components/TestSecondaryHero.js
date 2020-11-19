import { shallow } from 'enzyme';
import * as React from 'react';

import SecondaryHero, {
  SECONDARY_HERO_CLICK_ACTION,
  SECONDARY_HERO_CLICK_CATEGORY,
  SECONDARY_HERO_SRC,
} from 'amo/components/SecondaryHero';
import { createInternalHeroShelves } from 'amo/reducers/home';
import LoadingText from 'ui/components/LoadingText';
import { addQueryParams } from 'core/utils/url';
import { DEFAULT_UTM_SOURCE, DEFAULT_UTM_MEDIUM } from 'core/constants';
import {
  createFakeEvent,
  createFakeTracking,
  createHeroShelves,
  fakeAddon,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const createShelfData = (secondaryProps = {}) => {
    return createInternalHeroShelves(
      createHeroShelves({ primaryProps: { addon: fakeAddon }, secondaryProps }),
    ).secondary;
  };

  const render = (props = {}) => {
    return shallow(<SecondaryHero {...props} />);
  };

  it('renders a message with an internal link', () => {
    const cta = { text: 'cta text', url: 'some/url' };
    const _checkInternalURL = sinon
      .stub()
      .returns({ isInternal: true, relativeURL: cta.url });
    const description = 'A description';
    const headline = 'A Headline';
    const shelfData = createShelfData({ cta, description, headline });

    const root = render({ _checkInternalURL, shelfData });

    expect(root.find('.SecondaryHero-message-headline')).toHaveText(headline);
    expect(root.find('.SecondaryHero-message-description')).toHaveText(
      description,
    );
    expect(root.find('.SecondaryHero-message-linkText')).toHaveText(cta.text);
    const link = root.find('.SecondaryHero-message-link');
    expect(link).toHaveProp(
      'to',
      addQueryParams(cta.url, {
        utm_source: DEFAULT_UTM_SOURCE,
        utm_medium: DEFAULT_UTM_MEDIUM,
        utm_content: SECONDARY_HERO_SRC,
      }),
    );
    expect(link).not.toHaveProp('target');
    sinon.assert.calledWith(
      _checkInternalURL,
      sinon.match({ urlString: sinon.match(cta.url) }),
    );
  });

  it('renders a message with an external link', () => {
    const _checkInternalURL = sinon.stub().returns({ isInternal: false });
    const cta = { text: 'cta text', url: 'some/url' };
    const shelfData = createShelfData({ cta });

    const root = render({ _checkInternalURL, shelfData });

    expect(root.find('.SecondaryHero-message-linkText')).toHaveText(cta.text);
    const link = root.find('.SecondaryHero-message-link');
    expect(link).toHaveProp(
      'href',
      addQueryParams(cta.url, {
        utm_source: DEFAULT_UTM_SOURCE,
        utm_medium: DEFAULT_UTM_MEDIUM,
        utm_content: SECONDARY_HERO_SRC,
      }),
    );
    expect(link).toHaveProp('prependClientApp', false);
    expect(link).toHaveProp('prependLang', false);
    expect(link).toHaveProp('target', '_blank');
    sinon.assert.calledWith(
      _checkInternalURL,
      sinon.match({ urlString: sinon.match(cta.url) }),
    );
  });

  it('renders a message without a link', () => {
    const shelfData = createShelfData({ cta: null });

    const root = render({ shelfData });

    expect(root.find('.SecondaryHero-message-linkText')).toHaveLength(0);
  });

  it('sends a tracking event when the cta is clicked', () => {
    const _tracking = createFakeTracking();
    const cta = { text: 'cta text', url: 'some/url' };
    const shelfData = createShelfData({ cta });

    const root = render({ _tracking, shelfData });

    const event = createFakeEvent({ currentTarget: { href: cta.url } });
    root.find('.SecondaryHero-message-link').simulate('click', event);

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: SECONDARY_HERO_CLICK_ACTION,
      category: SECONDARY_HERO_CLICK_CATEGORY,
      label: event.currentTarget.href,
    });
    sinon.assert.calledOnce(_tracking.sendEvent);
  });

  it('renders in a loading state', () => {
    const root = render();

    expect(root.find(LoadingText)).toHaveLength(11);
  });

  it('renders nothing if shelfData is null', () => {
    const root = render({ shelfData: null });

    expect(root.find('.SecondaryHero')).toHaveLength(0);
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

    it.each([
      [0, 'internal', module1],
      [1, 'undefined', module2],
      [2, 'external', module3],
    ])(
      'renders the module at position "%s" with an %s link',
      (moduleIndex, linkType, moduleData) => {
        const _checkInternalURL = sinon.stub().returns({
          isInternal: linkType === 'internal',
          relativeURL: moduleData.cta && moduleData.cta.url,
        });

        const root = render({ _checkInternalURL, shelfData });

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
          sinon.assert.calledWith(
            _checkInternalURL,
            sinon.match({ urlString: sinon.match(moduleData.cta.url) }),
          );
          expect(module.find('.SecondaryHero-module-linkText')).toHaveText(
            moduleData.cta.text,
          );

          const link = module.find('.SecondaryHero-module-link');

          if (linkType === 'external') {
            expect(link).toHaveProp(
              'href',
              addQueryParams(moduleData.cta.url, {
                utm_source: DEFAULT_UTM_SOURCE,
                utm_medium: DEFAULT_UTM_MEDIUM,
                utm_content: SECONDARY_HERO_SRC,
              }),
            );
            expect(link).toHaveProp('target', '_blank');
          } else if (linkType === 'internal') {
            expect(link).toHaveProp(
              'to',
              addQueryParams(moduleData.cta.url, {
                utm_source: DEFAULT_UTM_SOURCE,
                utm_medium: DEFAULT_UTM_MEDIUM,
                utm_content: SECONDARY_HERO_SRC,
              }),
            );
            expect(link).not.toHaveProp('target');
          }
        }
      },
    );

    it('sends a tracking event when the cta is clicked', () => {
      const strippedUrl = '/a/different/url';
      const _stripLangFromAmoUrl = sinon.stub().returns(strippedUrl);
      const _tracking = createFakeTracking();
      const root = render({ _stripLangFromAmoUrl, _tracking, shelfData });

      const event = createFakeEvent({
        currentTarget: { href: module1.cta.url },
      });

      root.find('.SecondaryHero-module-link').at(0).simulate('click', event);

      sinon.assert.calledWith(_stripLangFromAmoUrl, {
        urlString: module1.cta.url,
      });
      sinon.assert.calledWith(_tracking.sendEvent, {
        action: SECONDARY_HERO_CLICK_ACTION,
        category: SECONDARY_HERO_CLICK_CATEGORY,
        label: strippedUrl,
      });
      sinon.assert.calledOnce(_tracking.sendEvent);
    });
  });
});
