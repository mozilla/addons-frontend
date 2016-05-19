const realSinon = sinon;
window.sinon = realSinon.sandbox.create();
window.sinon.createStubInstance = realSinon.createStubInstance;

afterEach(() => {
  window.sinon.restore();
});
