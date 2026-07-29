// Polyfills for older Android browsers, Chrome 79+, Mi Browser, Phoenix Browser & WebViews

if (typeof window !== 'undefined') {
  // globalThis polyfill
  if (typeof (window as any).globalThis === 'undefined') {
    (window as any).globalThis = window;
  }
  if (typeof (window as any).global === 'undefined') {
    (window as any).global = window;
  }

  // Object.fromEntries polyfill
  if (!Object.fromEntries) {
    Object.fromEntries = function (iterable: any) {
      return Array.from(iterable).reduce((obj: any, [key, val]: any) => {
        obj[key] = val;
        return obj;
      }, {});
    };
  }

  // Array.prototype.flat polyfill
  if (!Array.prototype.flat) {
    (Array.prototype as any).flat = function (depth = 1) {
      const flattener = (arr: any[], d: number): any[] => {
        return d > 0
          ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flattener(val, d - 1) : val), [])
          : arr.slice();
      };
      return flattener(this, depth);
    };
  }

  // Array.prototype.flatMap polyfill
  if (!Array.prototype.flatMap) {
    (Array.prototype as any).flatMap = function (callback: any, thisArg?: any) {
      return this.map(callback, thisArg).flat();
    };
  }

  // Promise.allSettled polyfill
  if (!Promise.allSettled) {
    Promise.allSettled = function <T>(promises: Iterable<T | PromiseLike<T>>): Promise<Array<PromiseSettledResult<Awaited<T>>>> {
      return Promise.all(
        Array.from(promises).map((p) =>
          Promise.resolve(p).then(
            (value) => ({ status: 'fulfilled' as const, value }),
            (reason) => ({ status: 'rejected' as const, reason })
          )
        )
      );
    };
  }

  // String.prototype.replaceAll polyfill
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (str: any, newStr: any) {
      if (Object.prototype.toString.call(str) === '[object RegExp]') {
        return this.replace(str, newStr);
      }
      return this.replace(new RegExp(String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);
    };
  }

  // Safe localStorage wrapper fallback
  try {
    const testKey = '__test_storage__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch (e) {
    console.warn('localStorage is not accessible in this browser session. Using memory fallback.');
    const memoryStorage: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => memoryStorage[key] || null,
        setItem: (key: string, value: string) => { memoryStorage[key] = String(value); },
        removeItem: (key: string) => { delete memoryStorage[key]; },
        clear: () => { Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]); },
        key: (index: number) => Object.keys(memoryStorage)[index] || null,
        get length() { return Object.keys(memoryStorage).length; }
      },
      writable: true
    });
  }
}

export {};
