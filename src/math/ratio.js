// file: ratio.js
// From blog: https://jrsinclair.com/articles/2020/sick-of-the-jokes-write-your-own-arbitrary-precision-javascript-math-library/
// See code sandbox: https://codesandbox.io/p/sandbox/ratio-high-precision-math-hwnry?file=%2Fsrc%2Fratio.js

/* global BigInt */
const PRECISION = 100; // Precision for converting numbers to fractions. The higher this number, the slower everything gets.

// THIS IS SO MALICIOUS!
// function bigIntPow(x, y) {
//   if (BigInt(y) === BigInt(0)) return BigInt(1);
//   let z = BigInt(x);
//   for (let i = 1; i < y; i++) {
//     z = z * BigInt(x);
//   }
//   return z;
// }

const leftPad = (n, s) => [...new Array(Math.max(0, n - s.length))].map(() => "0").join("") + s;

/**
 * Memoize.
 * @template F extends Function
 * @param {F} f The function to memoize
 * @returns {F} A memoized version of f.
 */
export function memoize(f) {
  const store = new Map();
  return function (...args) {
    const k = args.join("_⚮_");
    if (store.has(k)) {
      return store.get(k);
    }
    const v = f(...args);
    store.set(k, v);
    return v;
  };
}

/**
 * Sign.
 *
 * @param {bigint} x Value to find the sign of.
 * @returns {bigint} Sign of the provided value (i.e. -1, 0 or 1).
 */
function sign(x) {
  return x === BigInt(0) ? BigInt(0) : x > BigInt(0) ? BigInt(1) : BigInt(-1);
}

/**
 * Absolute value.
 *
 * @param {bigint} x The value to find the absolute value of.
 * @returns {bigint} The absolute value of x.
 */
function abs(x) {
  return x < BigInt(0) ? BigInt(x) * BigInt(-1) : BigInt(x);
}

/**
 * Greatest common denominator.
 *
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint} Greatest common denominator between a and b
 */
function _gcd(a, b) {
  let r;
  while (a % b > BigInt(0)) {
    r = a % b;
    a = b;
    b = r;
  }
  return b;
}
const gcd = memoize(_gcd);

// const MAX = BigInt(1e100);
// const HALF_MAX = BigInt(1e50);
/**
 * Simplify.
 *
 * Given a numerator and denominator, find the smallest two integers that
 * can represent that ratio.
 *
 * @param {bigint} numerator Numerator of the ratio to simplify.
 * @param {bigint} denominator Denominator of the ratio to simplify.
 */
function _simplify(numerator, denominator) {
  const sgn = sign(numerator) * sign(denominator);
  const n = abs(BigInt(numerator));
  const d = abs(denominator);
  if (!d) {
    if (n > 0) return Ratio.INFINITY;
    return Ratio.NEGINFINITY;
  }
  let f = gcd(n, d);
  // if (denominator > MAX && numerator > MAX) {
  //   const numeratorLength = numerator.toString().length
  //   const denominatorLength = denominator.toString().length
  //   f = f > HALF_MAX ? f : numeratorLength > denominatorLength ? BigInt(Math.floor(denominatorLength * 2/3)) : BigInt(Math.floor(numeratorLength * 2/3));
  // }
  return new Ratio((sgn * n) / f, d / f);
}
const simplify = memoize(_simplify);

/**
 * Plus or minus.
 *
 * Take a "+" or "-" character and convert it ot +1 or -1 respectively.
 * @param {string} c A character to test for being plus or minus.
 */
function pm(c) {
  return parseFloat(c + "1");
}

/**
 * Exponentiate 10.
 *
 * Take 10 to the power of a number.
 * @param {number} n The power to raise 10 to.
 */
function exp10(n) {
  return BigInt(`1${[...new Array(n)].map(() => 0).join("")}`);
}

export default class Ratio {
  static ZERO = Ratio.fromInt(0);
  static ONE = Ratio.fromInt(1);
  static E = Ratio.fromNumber(Math.E);
  static PI = Ratio.fromNumber(Math.PI);
  static INFINITY = new Ratio(1n, 0n);
  static NEGINFINITY = new Ratio(-1n, 0n);

  /**
   * Ratio Constructor.
   * @param {bigint} n The numerator for our ratio.
   * @param {bigint} d The denominator for our ratio.
   */
  constructor(n, d = BigInt(1)) {
    this.numerator = n;
    this.denominator = d;
  }

  /**
   * Equals.
   * @param {Ratio} other Another ratio to test for equality.
   * @requires this !== INFINITY or NEGINFINITY
   * @returns {boolean} True if the two ratios are equivalent.
   */
  equals(other) {
    return this.numerator * other.denominator === this.denominator * other.numerator;
    // const a = simplify(this.numerator, this.denominator);
    // const b = simplify(other.numerator, other.denominator);
    // return a.numerator === b.numerator && a.denominator === b.denominator;
  }

  /**
   * Less than or equal to.
   * @param {Ratio} other Another ratio to compare to this one.
   * @requires this !== INFINITY or NEGINFINITY
   * @returns {boolean} Returns true if this ratio is less than or equal to the other ratio.
   */
  lte(other) {
    if (other === Ratio.INFINITY) return true;
    if (other === Ratio.NEGINFINITY) return false;
    return this.numerator * other.denominator <= this.denominator * other.numerator;
    // const { numerator: thisN, denominator: thisD } = simplify(this.numerator, this.denominator);
    // const { numerator: otherN, denominator: otherD } = simplify(other.numerator, other.denominator);
    // return thisN * otherD <= otherN * thisD;
  }

  /**
   * Less than.
   * @param {Ratio} other The other ratio to compare to this one.
   * @requires this !== INFINITY or NEGINFINITY
   * @return {boolean}
   */
  lt(other) {
    if (other === Ratio.INFINITY) return true;
    if (other === Ratio.NEGINFINITY) return false;
    return this.numerator * other.denominator < this.denominator * other.numerator;
    // return this.lte(other) && !this.equals(other);
  }

  /**
   * Greater than.
   * @param {Ratio} other The other ratio to compare this one against.
   * @requires this !== INFINITY or NEGINFINITY
   * @return {boolean} True if this value is greater than the other value.
   */
  gt(other) {
    if (other === Ratio.INFINITY) return false;
    if (other === Ratio.NEGINFINITY) return true;
    return this.numerator * other.denominator > this.denominator * other.numerator;
    // return !this.lte(other);
  }

  /**
   * Greater than or equal to.
   * @param {Ratio} other The other ratio to compare to this one.
   * @requires this !== INFINITY or NEGINFINITY
   * @return {boolean}
   */
  gte(other) {
    if (other === Ratio.INFINITY) return false;
    if (other === Ratio.NEGINFINITY) return true;
    return this.numerator * other.denominator >= this.denominator * other.numerator;
    // return this.gt(other) || this.equals(other);
  }

  /**
   * Return larger value
   * @param {Ratio} other The other ratio to compare to this one.
   * @returns {Ratio}
   */
  max(other) {
    return this.lt(other) ? other : this;
  }

  /**
   * Return smaller value
   * @param {Ratio} other The other ratio to compare to this one.
   * @returns {Ratio}
   */
  min(other) {
    return this.gt(other) ? other : this;
  }

  /**
   * Times.
   *
   * Multiply this ratio by another ratio.
   * @param {Ratio} x Another ratio to multiply this one by.
   * @returns {Ratio} A new ratio representing the multiplied value.
   */
  times(x) {
    return simplify(x.numerator * this.numerator, x.denominator * this.denominator);
  }

  /**
   * Divide by.
   *
   * @param {Ratio} x The ratio to divide this one by.
   * @returns {Ratio} this / x. A new ratio representing the divided value.
   */
  divideBy(x) {
    return simplify(this.numerator * x.denominator, this.denominator * x.numerator);
  }

  /**
   * Divide by.
   *
   * @param {Ratio} x The ratio to divide this one by.
   * @returns {Ratio} x / this. A new ratio representing the divided value.
   */
  divide(x) {
    return simplify(this.denominator * x.numerator, this.numerator * x.denominator);
  }

  /**
   * Add.
   * @param {Ratio} x The other ratio to add to this one.
   * @returns {Ratio} A new simplified ratio, corresponding to the added value.
   */
  add(x) {
    return simplify(
      this.numerator * x.denominator + x.numerator * this.denominator,
      this.denominator * x.denominator
    );
  }

  addOne() {
    return new Ratio(this.numerator + this.denominator, this.denominator);
  }

  /**
   * Subtract.
   * @param {Ratio} x The ratio to subtract from this one.
   * @returns {Ratio} A new simplified ratio, corresponding to the subtracted value.
   */
  subtract(x) {
    return simplify(
      this.numerator * x.denominator - x.numerator * this.denominator,
      this.denominator * x.denominator
    );
  }

  subtractOne() {
    return new Ratio(this.numerator - this.denominator, this.denominator);
  }

  /**
   * Floor.
   *
   * Round the value towards zero,  returning whole integer.
   */
  floor() {
    const trunc = new Ratio(this.numerator / this.denominator, BigInt(1));
    if (this.gte(Ratio.ONE) || trunc.equals(this)) {
      return trunc;
    }
    return trunc.minus(Ratio.ONE);
  }

  /**
   * Ceil.
   *
   * Round the value away from zerio, returning a whole integer.
   */
  ceil() {
    const one = new Ratio(BigInt(1), BigInt(0));
    return this.equals(this.floor()) ? this : this.floor().add(one);
  }

  /**
   * N-th root.
   * @param {bigint} x The base to take the nth root of.
   * @param {bigint} n The nth root to calculate.
   */
  // BigInt ** BigInt overflows, nthRoot() DOES NOT WORK
  // static nthRoot(x, n) {
  //   if (x === BigInt(1)) return new Ratio(BigInt(1), BigInt(1));
  //   if (x === BigInt(0)) return new Ratio(BigInt(0), BigInt(1));
  //   if (x < 0) return new Ratio(BigInt(1), BigInt(0));

  //   // Get an initial estimate using floating point math
  //   const initialEstimate = Ratio.fromNumber(Math.pow(Number(x), 1 / Number(n)));

  //   const NUM_ITERATIONS = 3;
  //   return [...new Array(NUM_ITERATIONS)].reduce((r) => {
  //     return simplify(
  //       n - BigInt(1) * r.numerator ** n + x * r.denominator ** n,
  //       n * r.denominator * r.numerator ** (n - BigInt(1))
  //     );
  //   }, initialEstimate);
  // }

  abs() {
    return new Ratio(abs(this.numerator), abs(this.denominator));
  }

  /**
   * Power.
   * Estimate with floating point exponentiation
   *
   * @param {Ratio} n The exponent
   * @returns {Ratio} this ^ n
   */
  pow(n, precision = 20) {
    return Ratio.fromNumber(this.toValue(precision) ** n.toValue(precision));
  }

  /**
   * Power.
   * Estimate with floating point exponentiation
   *
   * @param {float} n The exponent
   * @returns {Ratio} this ^ n
   */
  powFloat(n, precision = 20) {
    return Ratio.fromNumber(this.toValue(precision) ** n);
  }

  /**
   * Power.
   *
   * @param {int} n The exponent
   * @returns {Ratio} this ^ n
   */
  powInt(n) {
    let cumulative = this;
    for (let i = 1; i < n; i++) {
      cumulative = cumulative.times(this);
    }
    return cumulative;
  }

  /**
   * Power.
   * Estimate with floating point exponentiation
   *
   * @param {float} n The base
   * @returns {Ratio} n ^ this
   */
  powOf(n, precision = 20) {
    return Ratio.fromNumber(n ** this.toValue(precision));
  }

  /**
   * @param {float} base
   * @returns {Ratio} log_base(this)
   */
  log(base = Math.E) {
    const value = Math.log(this.toValue());
    return base === Math.E ? Ratio.fromNumber(value) : Ratio.fromNumber(value / Math.log(base));
  }

  /**
   * Power.
   *
   * @param {Ratio} n The value to take this ratio to the power of.
   */
  // BigInt ** BigInt overflows, pow(n) DOES NOT WORK
  // pow(n) {
  //   const { numerator: nNumerator, denominator: nDenominator } = simplify(
  //     n.numerator,
  //     n.denominator
  //   );
  //   const { numerator, denominator } = simplify(this.numerator, this.denominator);
  //   if (nNumerator < 0) return this.invert().pow(n.abs());
  //   if (nNumerator === BigInt(0)) return Ratio.one;
  //   if (nDenominator === BigInt(1)) {
  //     return new Ratio(numerator ** nNumerator, denominator ** nNumerator);
  //   }
  //   if (numerator < 0 && nDenominator !== BigInt(1)) {
  //     return Ratio.infinity;
  //   }

  //   const { numerator: newN, denominator: newD } = Ratio.nthRoot(numerator, nDenominator).divideBy(
  //     Ratio.nthRoot(denominator, nDenominator)
  //   );
  //   return new Ratio(newN ** nNumerator, newD ** nNumerator);
  // }

  isInfinity() {
    return this.denominator === BigInt(0);
  }

  /**
   * Invert a ratio.
   * @return {Ratio} 1 / this
   */
  invert() {
    return new Ratio(this.denominator, this.numerator);
  }

  /**
   * @return {Ratio} -this
   */
  negative() {
    return new Ratio(-this.numerator, this.denominator);
  }

  /**
   * Calculate the integer part of calling log10().
   */
  floorLog10() {
    if (this.equals(simplify(0, 1))) {
      return new Ratio(BigInt(-1), BigInt(0));
    }
    return this.numerator >= this.denominator
      ? simplify((this.numerator / this.denominator).toString().length - 1, 1)
      : simplify(BigInt(-1), BigInt(1)).subtract(this.invert().floorLog10());
  }

  /**
   * To value.
   *
   * Converts the ratio back into a floating point number.
   * @returns {number} A floating point representation of the ratio.
   */
  toValue(precision = 60) {
    if (
      (this.numerator < 0 && this.denominator > 0) ||
      (this.numerator > 0 && this.denominator < 0)
    ) {
      return -this.abs().toValue(precision);
    }
    let intPart = this.numerator / this.denominator;
    const decimalPartExtra =
      (this.numerator * exp10(precision + 1)) / this.denominator - intPart * exp10(precision + 1);
    let decimalPart = decimalPartExtra / 10n;
    if (decimalPartExtra % 10n > 4n) {
      if (decimalPart === BigInt("9".repeat(precision))) {
        intPart += BigInt(1);
        decimalPart = 0;
      } else {
        decimalPart++;
      }
    }
    return Number(intPart) + Number(decimalPart) / 10 ** precision;
  }
  // toValue() {
  //   const intPart = this.numerator / this.denominator;
  //   return (
  //     Number(intPart) +
  //     Number(this.numerator - intPart * this.denominator) / Number(this.denominator)
  //   );
  // }

  /**
   * To String.
   *
   * @returns A string representation of the ratio.
   */
  toString() {
    return `${this.numerator} / ${this.denominator}`;
  }

  /**
   * TODO: Note that in the webapp, x is converted from string to number by the interface, then is converted back from number to string here. Could be more efficient to just pass the original string. Since fromNumber is only called in the constructor of the distributions, I'm not fussed about it at this stage. May need to correct in the future.
   *
   * Number to Ratio.
   * @param {number} x A number to convert to a ratio.
   */
  // static fromDecimal(x) {
  //   const expParse = /(-?\d+)?\.?(\d+)?/;
  //   const [, n = "0", decimals = ""] = x.toString().match(expParse) || [];

  //   return simplify(
  //     BigInt(`${n}${decimals}`) * exp10(PRECISION - decimals.length),
  //     exp10(PRECISION)
  //   );
  // }

  /**
   * Number to Ratio.
   * @param {number} x A number to convert to a ratio.
   */
  static fromNumber(x) {
    const expParse = /(-?\d)\.(\d+)e([-+])(\d+)/;
    const [, n, decimals, sgn, pow] = x.toExponential(PRECISION).match(expParse) || [];
    const exp = PRECISION - pm(sgn) * +pow;
    return exp < 0
      ? simplify(BigInt(`${n}${decimals}`) * exp10(-1 * exp), BigInt(1))
      : simplify(BigInt(`${n}${decimals}`), exp10(exp));
  }

  /**
   * integer to Ratio
   * @param {number} x
   * @returns
   */
  static fromInt(x) {
    return new Ratio(BigInt(x));
  }

  /**
   * Convert to a string with a fixed number of decimal places.
   * @param {number | bigint} n The number of decimal places to return.
   * @returns {string}
   */
  toFixed(n = 20) {
    if (
      (this.numerator < 0 && this.denominator > 0) ||
      (this.numerator > 0 && this.denominator < 0)
    ) {
      return "-" + this.abs().toFixed(n);
    }
    if (this.isInfinity()) {
      return this.toValue().toString();
    }
    let intPart = this.numerator / this.denominator;
    if (n === 0) {
      return `${intPart}`;
    }
    // const decimalPart =
    // (this.numerator * exp10(Number(n))) / this.denominator - intPart * exp10(Number(n));
    const decimalPartExtra =
      (this.numerator * exp10(n + 1)) / this.denominator - intPart * exp10(n + 1);
    let decimalPart = decimalPartExtra / 10n;
    if (decimalPartExtra % 10n > 4n) {
      if (decimalPart === BigInt("9".repeat(n))) {
        intPart += BigInt(1);
        decimalPart = 0;
      } else {
        decimalPart++;
      }
    }
    return `${intPart}.${leftPad(Number(n), "" + decimalPart)}`;
  }

  decimalCount() {
    // Convert to String
    const numberAsString = this.toValue().toString();
    // String Contains Decimal
    if (numberAsString.includes(".")) {
      return numberAsString.split(".")[1].length;
    }
    // String Does Not Contain Decimal
    return 0;
  }
}
