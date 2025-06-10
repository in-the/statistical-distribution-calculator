/* global BigInt */

/**
 * @requires n >= 0
 */
export const factorial = (function () {
  const cache = [BigInt(1), BigInt(1)];
  return function facto(n) {
    if (cache[n]) {
      return cache[n];
    }
    cache.push(BigInt(n) * facto(n - 1));
    return cache[n];
  };
})();

export function combination(totalNumber, chosenNumber) {
  return factorial(totalNumber) / factorial(chosenNumber) / factorial(totalNumber - chosenNumber);
}

export function permutation(totalNumber, chosenNumber) {
  return factorial(totalNumber) / factorial(totalNumber - chosenNumber);
}
