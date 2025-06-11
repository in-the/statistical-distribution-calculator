/* global BigInt */

/**
 * @param {int} n
 * @requires n >= 0
 * @returns {bigint} n!
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

/**
 * 
 * @param {int} totalNumber 
 * @param {int} chosenNumber 
 * @requires totalNumber >= chosenNumber >= 0
 * @returns {bigint} totalNumber C chosenNumber
 */
export function combination(totalNumber, chosenNumber) {
  return factorial(totalNumber) / factorial(chosenNumber) / factorial(totalNumber - chosenNumber);
}

/**
 * 
 * @param {int} totalNumber 
 * @param {int} chosenNumber 
 * @requires totalNumber >= chosenNumber >= 0
 * @returns {bigint} totalNumber P chosenNumber
 */
export function permutation(totalNumber, chosenNumber) {
  return factorial(totalNumber) / factorial(totalNumber - chosenNumber);
}
