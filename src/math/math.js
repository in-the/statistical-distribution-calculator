/* global BigInt */

import Ratio, { memoize } from "./ratio";

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
 * Seems to be accurate to 4 significant digits? Appears to bias towards smaller result
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
 * Newton-Raphson method for approximating zeros/roots of real-valued functions
 * @param {function (Ratio) => (Ratio)} func
 * @param {function (Ratio) => (Ratio)} derivative
 * @param {Ratio} initialGuess
 * @param {Ratio} tolerance
 * @param {int} maxIter
 * @param {Ratio} lowerBound
 * @param {Ratio} upperBound
 * @returns
 */
export function newtonRaphson(
  func, // function f(x) {Ratio} => {Ratio}
  initialGuess, // initial x0
  lowerBound = Ratio.NEGINFINITY,
  upperBound = Ratio.INFINITY,
  tolerance = Ratio.fromNumber(1e-8),
  maxIter = 100,
  derivative = undefined // optional: df/dx; if not provided, finite diff is used
) {
  let x = initialGuess;
  const h = Ratio.fromNumber(1e-6)
  const h2 = Ratio.fromNumber(2e-6)

  for (let i = 0; i < maxIter; i++) {
    let fx = func(x);
    if (fx.abs().lt(tolerance)) return x;

    let dfx;
    if (derivative) {
      dfx = derivative(x);
    } else {
      dfx = (func(x.add(h)).subtract(func(x.subtract(h)))).divideBy(h2);
    }

    if (dfx.equals(Ratio.ZERO)) break;

    x = x.subtract(fx.divideBy(dfx))

    // Clamp to bounds
    x = x.max(lowerBound).min(upperBound);
  }

  return x;
}

/**
 * Lanczos approximation
 * @param {Ratio} z
 * @returns {Ratio}
 */
function gammaLanczos(z) {
  // Coefficients for g = 7, n = 9
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ].map((x) => Ratio.fromNumber(x));
  const g = Ratio.fromInt(7);

  // if (z.lt(Ratio.fromNumber(0.5))) {
  //   // Use reflection formula for negative x
  //   return Ratio.fromNumber(Math.sin(z.times(Ratio.PI).toFixed()))
  //     .divide(Ratio.PI)
  //     .times(gamma(Ratio.ONE.subtract(z)));
  //   // return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
  // }

  z = z.subtractOne();
  let a = p[0];
  for (let i = 1; i < p.length; i++) {
    a = p[i].divideBy(z.add(Ratio.fromInt(i))).add(a);
  }

  z = z.add(Ratio.fromNumber(0.5));
  const t = z.add(g);
  return Ratio.PI.times(Ratio.fromInt(2))
    .powFloat(0.5)
    .times(t.pow(z))
    .times(Ratio.E.pow(t.negative()))
    .times(a);
  // return Ratio.fromNumber(Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a);
}

/**
 * Lanczos approximation
 * @param {Ratio} z
 * @returns {Ratio}
 */
export const gamma = memoize(gammaLanczos);

/**
 * @param {Ratio} z
 * @returns {Ratio}
 */
function logGamma(z) {
  return gamma(z).log();
}

/**
 * Difficulty with integrating near 0 since it approaches infinity
 * @param {Ratio} z
 * @returns {Ratio}
 */
// export function gamma(z) {
//   return improperIntegral(
//     (t) =>  t.pow(z.subtract(Ratio.ONE)).times(t.negative().powOf(Math.E)),
//     Ratio.fromNumber(0.001),
//     Ratio.fromNumber(0.0001)
//   );
// }

/**
 * Difficulty with integrating near 0 since it approaches infinity
 * @param {Ratio} s
 * @param {Ratio} x
 * @returns {Ratio}
 */
// export function lowerIncompleteGamma(s, x) {
//   return definiteIntegral(
//     (t) => t.pow(s.subtract(Ratio.ONE)).times(t.negative().powOf(Math.E)),
//     Ratio.fromNumber(0.0001),
//     Ratio.fromNumber(0.001)
//   )
//     .add(
//       definiteIntegral(
//         (t) => t.pow(s.subtract(Ratio.ONE)).times(t.negative().powOf(Math.E)),
//         Ratio.fromNumber(0.001),
//         Ratio.fromNumber(0.01)
//       )
//     )
//     .add(
//       definiteIntegral(
//         (t) => t.pow(s.subtract(Ratio.ONE)).times(t.negative().powOf(Math.E)),
//         Ratio.fromNumber(0.01),
//         Ratio.fromNumber(0.1)
//       )
//     )
//     .add(
//       definiteIntegral(
//         (t) => t.pow(s.subtract(Ratio.ONE)).times(t.negative().powOf(Math.E)),
//         Ratio.fromNumber(0.1),
//         Ratio.fromNumber(1)
//       )
//     )
//     .add(
//       definiteIntegral(
//         (t) => t.pow(s.subtract(Ratio.ONE)).times(t.negative().powOf(Math.E)),
//         Ratio.fromNumber(1),
//         x
//       )
//     );
// }

// Series expansion
function lowerIncompleteGammaSeriesExpansion(s, x, tolerance, maxIter) {
  let term = s.invert();
  let sum = term;
  for (let n = 1; n < maxIter; n++) {
    term = term.times(x).divideBy(s.add(Ratio.fromInt(n)));
    sum = sum.add(term);
    if (term.lt(sum.times(tolerance))) break;
  }
  return sum.times(Ratio.E.pow(x.negative())).times(x.pow(s));
}

// Continued fraction (Lentz's method)
function lowerIncompleteGammaContinuedFraction(s, x, tolerance, maxIter) {
  const tiny = Ratio.fromNumber(1e-300);
  const b0 = x.addOne().subtract(s);
  let f = b0.abs().lt(tiny) ? tiny : b0;
  let C = f,
    D = Ratio.ZERO;
  for (let n = 1; n < maxIter; n++) {
    const N = Ratio.fromInt(n);
    const a = s.subtract(N).times(N);
    const b = Ratio.fromInt(2).times(N).add(b0);

    C = a.divideBy(C).add(b);
    if (C.abs().lt(tiny)) C = tiny;
    D = a.times(D).add(b);
    if (D.abs().lt(tiny)) D = tiny;
    D = D.invert();
    const delta = C.times(D);

    f = f.times(delta);
    if (delta.subtract(Ratio.ONE).abs().lt(tolerance)) break;
  }
  const Q = x.log().times(s).subtract(x).subtract(gamma(s).log()).powOf(Math.E).divideBy(f);
  return gamma(s).times(Ratio.ONE.subtract(Q));
}

/**
 * Series expansion when x<s+1 -> fast convergence
 * Continued fraction (Lentz's method) when x≥s+1 -> more stable for large
 * @param {Ratio} s
 * @param {Ratio} x
 * @param {Ratio} tolerance
 * @param {int} maxIter
 * @returns {Ratio}
 */
export function lowerIncompleteGamma(s, x, tolerance = Ratio.fromNumber(1e-10), maxIter = 1000) {
  if (x.equals(Ratio.ZERO)) return Ratio.ZERO;
  if (x.lt(s.addOne())) {
    return lowerIncompleteGammaSeriesExpansion(s, x, tolerance, maxIter);
  } else {
    return lowerIncompleteGammaContinuedFraction(s, x, tolerance, maxIter);
  }
}

/**
 * @param {Ratio} a
 * @param {Ratio} b
 * @returns {Ratio}
 */
export function beta(a, b) {
  return gamma(a)
    .times(gamma(b))
    .divideBy(gamma(a.add(b)));
}

/**
 * @param {Ratio} a
 * @param {Ratio} b
 * @returns {Ratio}
 */
function logBeta(a, b) {
  return logGamma(a)
    .add(logGamma(b))
    .subtract(logGamma(a.add(b)));
}

/**
 * Too slow, so used floating point version instead
 * @param {Ratio} x
 * @param {Ratio} a
 * @param {Ratio} b
 * @returns {Ratio}
 */
function betaContinuedFractionRatio(x, a, b) {
  // Continued fraction using Lentz’s algorithm
  const maxIter = 200;
  const tolerance = Ratio.fromNumber(3e-7);
  const tiny = Ratio.fromNumber(1e-30);

  const qab = a.add(b);
  const qap = a.addOne();
  const qam = a.subtractOne();
  let c = Ratio.ONE;
  let d = Ratio.ONE.subtract(qab.times(x).divideBy(qap));
  if (d.abs().lt(tiny)) d = tiny;
  d = d.invert();
  let h = d;

  for (let m = 1; m <= maxIter; m++) {
    const m1 = Ratio.fromInt(m);
    const m2 = Ratio.fromInt(2 * m);
    // even step
    let aa = b
      .subtract(m1)
      .times(m1)
      .times(x)
      .divideBy(qam.add(m2).times(a.add(m2)));
    c = aa.divideBy(c).addOne();
    if (c.abs().lt(tiny)) c = tiny;
    d = aa.times(d).addOne();
    if (d.abs().lt(tiny)) d = tiny;
    d = d.invert();
    h = h.times(d).times(c);

    // odd step
    aa = a
      .add(m1)
      .negative()
      .times(qab.add(m1))
      .times(x)
      .divideBy(a.add(m2).times(qap.add(m2)));
    c = aa.divideBy(c).addOne();
    if (c.abs().lt(tiny)) c = tiny;
    d = aa.times(d).addOne();
    if (d.abs().lt(tiny)) d = tiny;
    d = d.invert();
    let del = c.times(d);
    h = h.times(del);

    if (del.subtractOne().abs().lt(tolerance)) break;
  }

  return h;
}

/**
 * Ratio version is too slow, so used floating point version instead
 * @param {Ratio} x
 * @param {Ratio} a
 * @param {Ratio} b
 * @returns {Ratio}
 */
function betaContinuedFraction(xRatio, aRatio, bRatio) {
  const x = xRatio.toValue();
  const a = aRatio.toValue();
  const b = bRatio.toValue();

  // Continued fraction using Lentz’s algorithm
  const MAX_ITER = 200;
  const EPS = 3e-7;
  const FPMIN = 1e-30;

  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1.0;
  let d = 1.0 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1.0 / d;
  let h = d;

  for (let m = 1; m <= MAX_ITER; m++) {
    let m2 = 2 * m;
    // even step
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    h *= d * c;

    // odd step
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    let del = d * c;
    h *= del;

    if (Math.abs(del - 1.0) < EPS) break;
  }

  return Ratio.fromNumber(h);
}

/**
 * Ix(a, b) = B(x;a,b) / B(a,b)
 * @param {Ratio} x
 * @param {Ratio} a
 * @param {Ratio} b
 * @returns {Ratio}
 */
export function regularisedIncompleteBeta(x, a, b) {
  if (x.lte(Ratio.ZERO)) return Ratio.ZERO;
  if (x.gte(Ratio.ONE)) return Ratio.ONE;


  if (a.addOne().divideBy(a.add(b).add(Ratio.fromInt(2))).gte(x)){
  const front = a
    .times(x.log())
    .add(b.times(Ratio.ONE.subtract(x).log()))
    .subtract(logBeta(a, b))
    .powOf(Math.E)
    .divideBy(a);
    return betaContinuedFraction(x, a, b).times(front);
  } else {
    return Ratio.ONE.subtract(regularisedIncompleteBeta(Ratio.ONE.subtract(x), b, a))
  }
}

/**
 * @param {Ratio} p
 * @param {Ratio} a
 * @param {Ratio} b
 * @param {Ratio} tolerance
 * @param {int} maxIter
 * @returns {Ratio}
 */
export function regularisedIncompleteBetaInverse(
  p,
  a,
  b,
) {
  if (p.lte(Ratio.ZERO)) return Ratio.ZERO;
  if (p.gte(Ratio.ONE)) return Ratio.ONE;
  return newtonRaphson(
    (x) => regularisedIncompleteBeta(x, a, b).subtract(p),
    a.add(b).divide(a),
    Ratio.ZERO,
    Ratio.ONE
  )
}
