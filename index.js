export const wrapError = err => new Proxy(err, {
  getOwnPropertyDescriptor(target, key) {
    return { configurable: true, enumerable: true, value: target[key] };
  },
  ownKeys(target) {
    return Array.from(new Set([
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(target)),
      ...Object.getOwnPropertyNames(target),
    ]));
  },
});
