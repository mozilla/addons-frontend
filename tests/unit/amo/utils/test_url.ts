import url from 'url';

import { addQueryParams, removeUndefinedProps, getQueryParametersForAttribution } from 'amo/utils/url';
import { createFakeLocation } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('removeUndefinedProps', () => {
    it('removes undefined properties', () => {
      expect(removeUndefinedProps({
        thing: undefined,
      })).toEqual({});
    });
    it('preserves falsy properties', () => {
      expect(removeUndefinedProps({
        thing: false,
      })).toEqual({
        thing: false,
      });
    });
    it('preserves other properties', () => {
      expect(removeUndefinedProps({
        thing: 'thing',
      })).toEqual({
        thing: 'thing',
      });
    });
    it('does not modify the original object', () => {
      const example = {
        thing: undefined,
      };
      removeUndefinedProps(example);
      expect(example).toEqual({
        thing: undefined,
      });
    });
  });
  describe('addQueryParams', () => {
    it('adds a query param to a plain url', () => {
      const output = addQueryParams('http://whatever.com/', {
        foo: 'bar',
      });
      expect(url.parse(output, true).query).toEqual({
        foo: 'bar',
      });
    });
    it('adds more than one query param to a plain url', () => {
      const output = addQueryParams('http://whatever.com/', {
        foo: 'bar',
        test: 1,
      });
      expect(url.parse(output, true).query).toEqual({
        foo: 'bar',
        test: '1',
      });
    });
    it('overrides an existing parameter', () => {
      const output = addQueryParams('http://whatever.com/?foo=1', {
        foo: 'bar',
      });
      expect(url.parse(output, true).query).toEqual({
        foo: 'bar',
      });
    });
    it('overrides multiple existing parameters', () => {
      const output = addQueryParams('http://whatever.com/?foo=1&bar=2', {
        foo: 'bar',
        bar: 'baz',
      });
      expect(url.parse(output, true).query).toEqual({
        foo: 'bar',
        bar: 'baz',
      });
    });
    it('leaves other params intact', () => {
      const output = addQueryParams('http://whatever.com/?foo=1&bar=2', {
        bar: 'updated',
      });
      expect(url.parse(output, true).query).toEqual({
        foo: '1',
        bar: 'updated',
      });
    });
    it('handles relative URLs', () => {
      const output = addQueryParams('/relative/path/?one=1', {
        two: '2',
      });
      expect(output).toMatch(/^\/relative\/path\//);
      expect(url.parse(output, true).query).toEqual({
        one: '1',
        two: '2',
      });
    });
    it('removes undefined query parameters', () => {
      const output = addQueryParams('http://whatever.com/', {
        bar: undefined,
      });
      expect(url.parse(output, true).query).toEqual({});
    });
  });
  describe('getQueryParametersForAttribution', () => {
    it('returns the UTM parameters in the location when UTM flag is enabled', () => {
      const utm_campaign = 'some-utm-campaign';
      const location = createFakeLocation({
        query: {
          utm_campaign,
        },
      });
      expect(getQueryParametersForAttribution(location)).toEqual({
        utm_campaign,
      });
    });
  });
});