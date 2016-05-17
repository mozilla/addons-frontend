const realSinon = sinon;

beforeEach(() => {
  window.sinon = realSinon.sandbox.create();
});

afterEach(() => {
  window.sinon.restore();
  window.sinon = realSinon;
});
