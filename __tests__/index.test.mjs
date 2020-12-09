import mocha from 'mocha';
import chai from 'chai';
import createMagicError from '../index.mjs';

const { it } = mocha;
const { expect } = chai;

it('handles built-in errors', () => {
  const err = createMagicError(new ReferenceError('Impossible does not exist'));

  expect(Object.getOwnPropertyNames(err)).to.deep.equal([
    'stack',
    'message',
    'constructor',
    'name',
  ]);
  expect(Object.keys(err)).to.deep.equal(Object.getOwnPropertyNames(err));
  expect(err).to.be.instanceof(ReferenceError);
  expect(err.constructor).to.equal(ReferenceError);
  expect(Object.getPrototypeOf(err)).to.equal(ReferenceError.prototype);
});

it('handles subclassed errors', () => {
  class MyReferenceError extends ReferenceError {
    constructor() {
      super();

      this.kind = 'MyReferenceError';
    }
  }

  const err = createMagicError(new MyReferenceError());

  expect(Object.getOwnPropertyNames(err)).to.deep.equal([
    'stack',
    'kind',
    'constructor',
    'name',
    'message',
  ]);
  expect(Object.keys(err)).to.deep.equal(Object.getOwnPropertyNames(err));
  expect(err).to.be.instanceof(ReferenceError);
  expect(err).to.be.instanceof(MyReferenceError);
  expect(err.constructor).to.equal(MyReferenceError);
  expect(Object.getPrototypeOf(err)).to.equal(MyReferenceError.prototype);
});

it('handles deeply subclassed errors', () => {
  class ResolverError extends ReferenceError {
    constructor() {
      super();

      this.kind = 'ResolverError';
    }
  }

  class MissingExternalReference extends ResolverError {
    constructor() {
      super();

      this.kind = 'MissingExternalReference';
      this.source = 'path';
    }
  }

  const err = createMagicError(new MissingExternalReference());

  expect(Object.getOwnPropertyNames(err)).to.deep.equal([
    'stack',
    'kind',
    'source',
    'constructor',
    'name',
    'message',
  ]);
  expect(Object.keys(err)).to.deep.equal(Object.getOwnPropertyNames(err));
  expect(err).to.be.instanceof(ReferenceError);
  expect(err).to.be.instanceof(ResolverError);
  expect(err).to.be.instanceof(MissingExternalReference);
  expect(err.constructor).to.equal(MissingExternalReference);
  expect(Object.getPrototypeOf(err)).to.equal(
    MissingExternalReference.prototype,
  );
});

it('retains original [[writable]] of descriptor', () => {
  class ResolverError extends ReferenceError {}

  Object.defineProperty(ResolverError.prototype, 'kind', {
    value: 'ResolverError',
  });

  const err = createMagicError(new ResolverError());

  expect(Reflect.set(err, 'kind', 'test')).to.equal(false);
  expect(() => {
    err.kind = 'abc';
  }).to.throw(TypeError);
});
