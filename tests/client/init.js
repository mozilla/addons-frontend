const realSinon = sinon;

beforeEach(() => {
  window.sinon = realSinon.sandbox.create();
  window.sinon.createStubInstance = realSinon.createStubInstance;
});

afterEach(() => {
  window.sinon.restore();
  window.sinon = realSinon;
});
