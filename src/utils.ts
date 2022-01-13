
export function createSymbol(attr: string) {
  const key = `$$${attr}`;
  // when not suppert Symbol use $$-key
  //@ts-ignore
  return window.Symbol ? Symbol.for(key) : key;
}

/**
 * simulate request time, range 500 - 1000, type int
 * @returns delay
 */
export function getRequestDelay() {
  return Math.random() * 500 + 500 | 0
}

/** do nothing */
export function noop(): any {}