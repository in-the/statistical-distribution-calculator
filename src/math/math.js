/* global BigInt */

import Ratio from "./ratio";

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
 * @param {int} totalNumber
 * @param {int} chosenNumber
 * @requires totalNumber >= chosenNumber >= 0
 * @returns {bigint} totalNumber C chosenNumber
 */
export function combination(totalNumber, chosenNumber) {
  return factorial(totalNumber) / factorial(chosenNumber) / factorial(totalNumber - chosenNumber);
}

/**
 * @param {int} totalNumber
 * @param {int} chosenNumber
 * @requires totalNumber >= chosenNumber >= 0
 * @returns {bigint} totalNumber P chosenNumber
 */
export function permutation(totalNumber, chosenNumber) {
  return factorial(totalNumber) / factorial(totalNumber - chosenNumber);
}

/**
 * Five point midpoint approximation formula
 * @param {function} func (Ratio x) => Ratio f(x)
 * @param {Ratio} change
 * @returns {function} (Ratio x) => Ratio f'(x)
 */
export function differentiate(func, change = Ratio.fromNumber(0.001)) {
  const twoChange = Ratio.fromInt(2).times(change);
  return (x) =>
    func(x.add(twoChange))
      .negative()
      .add(func(x.add(change)).times(Ratio.fromInt(8)))
      .add(func(x.subtract(change)).times(Ratio.fromInt(-8)))
      .add(func(x.subtract(twoChange)))
      .divideBy(Ratio.fromInt(12).times(change));
}

/**
 * @param {function} func (Ratio x) => Ratio f(x)
 * @param {int} order
 * @param {Ratio} change
 * @returns {function} (Ratio x) => Ratio f^(n)(x)
 */
export function differentiateOrder(func, order, change = Ratio.fromNumber(0.001)) {
  if (order === 1) {
    return differentiate(func, change);
  }
  return differentiateOrder(differentiate(func), order - 1, change);
}

/**
 * TODO: Inverse didn't work as expected for lower incomplete gamma function
 * Taylor series reversion to get the inverse of the function. See https://math.stackexchange.com/questions/3693157/numerical-algorithm-for-finding-the-inverse-of-a-function
 * @param {function} func (Ratio x) => Ratio f(x)
 * @param {Ratio} estimate Needs to be close to true inverse to be accurate
 * @param {Ratio} change
 * @returns {function} (Ratio x) => Ratio f^-1(x)
 */
export function inverse(func, estimate = Ratio.ZERO) {
  return (y) => {
    const difference = y.subtract(func(estimate));
    const firstOrder = differentiate(func)(estimate);
    return estimate
      .add(difference.divideBy(firstOrder))
      .subtract(
        differentiateOrder(func, 2)(estimate)
          .divideBy(firstOrder.powInt(3))
          .divideBy(Ratio.fromInt(2))
          .times(difference.powInt(2))
      )
      .add(
        differentiateOrder(func, 2)(estimate)
          .powInt(2)
          .times(Ratio.fromInt(3))
          .subtract(differentiateOrder(func, 3)(estimate).times(firstOrder))
          .divideBy(firstOrder.powInt(5))
          .divideBy(Ratio.fromInt(6))
          .times(difference.powInt(3))
      );
  };
}

/**
 * Uses Simpson's rule 3/8 = approximate with cubics
 * @param {function} func (Ratio x) => Ratio f(x)
 * @param {Ratio} min
 * @param {Ratio} max
 * @param {int} intervals
 * @return {Ratio}
 */
export function definiteIntegral(func, min, max, intervals = 10) {
  let cumulative = Ratio.ZERO;
  const increment = max.subtract(min).divideBy(Ratio.fromInt(intervals * 3));
  for (
    let x = min.add(increment), counter = 1;
    counter < intervals * 3;
    x = x.add(increment), counter++
  ) {
    cumulative = cumulative.add(
      counter % 3 ? func(x).times(Ratio.fromInt(3)) : func(x).times(Ratio.fromInt(2))
    );
  }
  return cumulative
    .add(func(min))
    .add(func(max))
    .times(increment)
    .times(Ratio.fromNumber(3 / 8));
}

/**
 * Improper integral of func from min to +Infinity
 * Uses trapezoid with correction, from https://www.sciencedirect.com/science/article/pii/009630039290010X
 * Seems to be accurate to 4 significant digits?
 * @param {function} func (Ratio x) => Ratio f(x)
 * @param {Ratio} min
 * @param {Ratio} initialInterval
 * @param {Ratio} rate
 * @param {Ratio} epsilon
 */
export function improperIntegral(
  func,
  min = Ratio.ZERO,
  interval = Ratio.fromNumber(0.01),
  rate = Ratio.fromNumber(1.2),
  epsilon = Ratio.fromNumber(1e-10)
) {
  let cumulative = Ratio.ZERO;
  const TWO = Ratio.fromInt(2);
  const TWELVE = Ratio.fromInt(12);
  let previousX = min;
  let previousY = func(min);
  let nextX = min.add(interval);
  let nextY = func(nextX);
  let x, y;
  while (true) {
    x = nextX;
    y = nextY;
    nextX = x.add(interval);
    nextY = func(nextX);

    const trapezoidApproximation = x.subtract(previousX).times(y.add(previousY)).divideBy(TWO);
    const correctionApproximation = nextX
      .subtract(x)
      .times(y.subtract(previousY))
      .subtract(x.subtract(previousX).times(nextY.subtract(y)))
      .divideBy(TWELVE);
    const approximation = trapezoidApproximation.add(correctionApproximation);
    if (approximation.abs().lt(cumulative.times(epsilon))) {
      break;
    }
    cumulative = cumulative.add(approximation);

    previousX = x;
    previousY = y;
    interval = interval.times(rate);
  }
  return cumulative;
}

/**
 * @param {Ratio} z 
 * @returns {Ratio}
 */
export function gamma(z) {
  return improperIntegral((t) => t.pow(z.subtract(Ratio.ONE)).times(t.negative().powOf(Math.E)));
}

/**
 * @param {Ratio} s 
 * @param {Ratio} x
 * @returns {Ratio}
 */
export function lowerIncompleteGamma(s, x) {
  return definiteIntegral((t) => t.pow(s.subtract(Ratio.ONE)).times(t.negative().powOf(Math.E)), Ratio.ZERO, x);
}
