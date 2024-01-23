const forEach = Array.prototype.forEach;
const slice = Array.prototype.slice;

export function assignDefaults(target, ...sources) {
  forEach.call(sources, (source) => {
    if (source) {
      for (const key in source) {
        if (target[key] === undefined) {
          target[key] = source[key];
        }
      }
    }
  });
  return target;
}

export function extendObject(target, ...sources) {
  forEach.call(sources, (source) => {
    if (source) {
      for (const key in source) {
        target[key] = source[key];
      }
    }
  });
  return target;
}
