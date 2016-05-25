import setLanguage from 'core/i18n/middleware';

describe('i18n middlware', () => {
  let res;

  beforeEach(() => {
    res = {
      locals: {},
    };
  });

  it('should call next()', () => {
    const fakeNext = sinon.stub();
    const req = {};
    setLanguage(req, res, fakeNext);
    assert.ok(fakeNext.called);
  });

  it('should default to en-US', () => {
    const fakeNext = sinon.stub();
    const req = {};
    setLanguage(req, res, fakeNext);
    assert.equal(res.locals.lang, 'en-US');
  });

  it('should set lang based on query-string', () => {
    const fakeNext = sinon.stub();
    const req = {
      query: {
        lang: 'pt-PT',
      },
    };
    setLanguage(req, res, fakeNext);
    assert.equal(res.locals.lang, 'pt-PT');
  });

  it('should provide default if bogus value', () => {
    const fakeNext = sinon.stub();
    const req = {
      query: {
        lang: 'whatevs',
      },
    };
    setLanguage(req, res, fakeNext);
    assert.equal(res.locals.lang, 'en-US');
  });

  it('should provide default if bogus type', () => {
    const fakeNext = sinon.stub();
    const req = {
      query: {
        lang: 1,
      },
    };
    setLanguage(req, res, fakeNext);
    assert.equal(res.locals.lang, 'en-US');
  });
});
