import { PRECISION } from "components/Calculator";
import { combination, factorial } from "./math";
import Ratio from "math/ratio";

export function positiveInteger(variable, symbol) {
  if (isNaN(variable) || variable === Infinity || variable % 1 || variable < 0) {
    alert(`${symbol} must be a positive integer`);
    return false;
  }
  return true;
}

export function positiveIntegerNeqZero(variable, symbol) {
  if (isNaN(variable) || variable === Infinity || variable % 1 || variable <= 0) {
    alert(`${symbol} must be a positive integer`);
    return false;
  }
  return true;
}

export function positiveIntegerMin(variable, symbol, min) {
  if (isNaN(variable) || variable === Infinity || variable % 1 || variable < min) {
    alert(`${symbol} must be an integer ≥ ${min}`);
    return false;
  }
  return true;
}

function real(variable, symbol) {
  if (isNaN(variable) || variable === Infinity) {
    alert(`${symbol} must be a real number`);
    return false;
  }
  return true;
}

function positiveRealNeqZero(variable, symbol) {
  if (isNaN(variable) || isNaN(parseFloat(variable)) || variable <= 0 || variable === Infinity) {
    alert(`${symbol} must be greater than 0`);
    return false;
  }
  return true;
}

function realInRange(variable, min, max, symbol) {
  if (isNaN(variable) || isNaN(parseFloat(variable)) || variable < min || variable > max) {
    alert(`${symbol} must be in range [${min}, ${max}]`);
    return false;
  }
  return true;
}

export const summaryLegend = {
  PMF: "PMF",
  expectation: "Expectation",
  variance: "Variance",
  skewness: "Skewness",
  MGF: "MGF",
  CF: "CF",
  PGF: "PGF",
};

const SUMMARYPRECISION = 2;

const ESTIMATE_PRECISION = 20;

class DiscreteDistribution {
  TYPE = "discrete";

  /**
   * @param {int} max
   * @param {int} min
   * @returns [[Ratio] pdf, [Ratio] cdf]
   */
  distributionSetRange(max, min = 0) {
    const pdf = [];
    const cdf = [];
    let cumulative = Ratio.ZERO;
    for (let x = min; x <= max; x++) {
      const p = this.probability(x);
      pdf.push(p);
      cumulative = cumulative.add(p);
      cdf.push(cumulative);
    }
    return [pdf, cdf];
  }

  /**
   * @param {int} min
   * @returns
   */
  distributionDynamicRange(min = 0) {
    const pdf = [];
    const cdf = [];
    let cumulative = Ratio.ZERO;
    for (let x = min; Number(cumulative.toFixed(PRECISION)) < 1; x++) {
      const p = this.probability(x);
      pdf.push(p);
      cumulative = cumulative.add(p);
      cdf.push(cumulative);
    }
    return [pdf, cdf];
  }

  /**
   * Sets pdf+cdf if not already set
   * @returns {<array[Ratio]>} pdf P(X = x) forall x
   */
  pdf() {
    if (typeof this.pdfDistribution === "undefined") {
      this.setDistribution();
    }
    this.pdf = () => this.pdfDistribution;
    return this.pdfDistribution;
  }

  /**
   * Sets pdf+cdf if not already set
   * @returns {<array[Ratio]>} cdf P(X <= x) for all x
   */
  cdf() {
    if (typeof this.cdfDistribution === "undefined") {
      this.setDistribution();
    }
    this.cdf = () => this.cdfDistribution;
    return this.cdfDistribution;
  }

  /**
   * @param {float} cumulativeProbability
   * @returns {int} Quantile of distribution at cumulativeProbability
   */
  quantile(cumulativeProbability) {
    if (typeof this.cdfDistribution === "undefined") {
      this.setDistribution();
    }
    this.quantile = (cumulativeProbability) => {
      const cumulative = Ratio.fromDecimal(cumulativeProbability);
      let q = 0;
      while (true) {
        if (this.cdfDistribution[q].gt(cumulative) || q === this.cdfDistribution.length) {
          return q;
        }
        q++;
      }
    };
    return this.quantile(cumulativeProbability);
  }

  /**
   * @param {int} count
   * @returns {array[int]} Array of <count> random observations from distribution
   */
  observe(count = 1) {
    const observations = [];
    for (let i = 0; i < count; i++) {
      observations.push(this.quantile(Math.random()));
    }
    return observations;
  }
}

class Binomial extends DiscreteDistribution {
  /**
   * @param {int} size
   * @param {float} prob
   * @requires 0 <= x <= size
   * @requires 0 <= prob <= 1
   */
  constructor(size, prob) {
    super();
    this.size = size;
    this.probFloat = prob.toFixed(SUMMARYPRECISION);
    this.prob = Ratio.fromDecimal(prob);

    this.px = [Ratio.ONE];
    this.cpx = [Ratio.ONE];
    let px = Ratio.ONE;
    const cp = Ratio.ONE.subtract(this.prob);
    let cpx = Ratio.ONE;
    for (let i = 1; i <= size; i++) {
      px = px.times(this.prob);
      this.px.push(px);
      cpx = cpx.times(cp);
      this.cpx.push(cpx);
    }
  }

  /**
   * @param {int} x
   * @returns {Ratio} P(X = x)
   */
  probability(x) {
    return new Ratio(combination(this.size, x)).times(this.px[x]).times(this.cpx[this.size - x]);
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution, this.cdfDistribution] = this.distributionSetRange(this.size);
  }

  // /**
  //  * @param {int} x
  //  * @param {int} size
  //  * @param {Ratio} prob
  //  * @requires 0 <= x <= size
  //  * @requires 0 <= prob <= 1
  //  * @returns {Ratio}
  //  */
  // static probabiblity(x, size, prob) {
  //   const nCx = new Ratio(combination(size, x));
  //   const px = prob.pow(Ratio.fromInt(x));
  //   const complement = Ratio.ONE.subtract(prob).pow(new Ratio(size - x));
  //   return nCx.times(px).times(complement);
  // }

  // /**
  //  * @param {int} size
  //  * @param {float} prob
  //  * @requires 0 <= x <= size
  //  * @requires 0 <= prob <= 1
  //  * @returns [array[Ratio], array[Ratio]] pdf, cdf
  //  */
  // static distribution(size, prob) {
  //   const probRatio = Ratio.fromNumber(prob);
  //   return distribution((x) => Binomial.probabiblity(x, size, probRatio), size);
  // }

  summary() {
    const cprob = 1 - this.probFloat;
    const summaryStatistics = {
      PMF: {
        formula: "P(X=k) = nCk p^k q^(n-k)",
        value: `${this.size}Ck ${this.probFloat}^k ${cprob}^(${this.size}-k)`,
      },
      expectation: {
        formula: "E[X] = np",
        value: this.size * this.probFloat,
      },
      variance: { formula: "Var[X] = npq", value: this.size * this.probFloat * cprob },
      skewness: {
        formula: "Skew[X] = (q-p) / sqrt(npq)",
        value: (cprob - this.probFloat) / (this.size * this.probFloat * cprob) ** 0.5,
      },
      MGF: {
        formula: "M_X(t) = (p + pe^t)^n",
        value: `(${this.probFloat} + ${this.probFloat}e^t)^${this.size}`,
      },
      CF: {
        formula: "φ_X(t) = (p + pe^it)^n",
        value: `(${this.probFloat} + ${this.probFloat}e^it)^${this.size}`,
      },
      PGF: { formula: "G(z) = (q + pz)^n", value: `(${cprob} + ${this.probFloat}z)^${this.size}` },
    };
    this.summary = () => summaryStatistics;
    return this.summary();
  }

  static settings = {
    distribution: Binomial,

    title: "Binomial",
    interpretation:
      "Number of success in a sequence of n independent experiments with success of probability p, failure of probability q = 1 - p",
    name: (parameters) => `Binomial distribution (n=${parameters[0]}, p=${parameters[1]})`,
    rCode: (parameters) => ({
      pdf: `dbinom(x, ${parameters[0]}, ${parameters[1]})`,
      cdf: `pbinom(x, ${parameters[0]}, ${parameters[1]})`,
      cdfReverse: `pbinom(x, ${parameters[0]}, ${parameters[1]}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) =>
        `qbinom(${cumulativeProbability}, ${parameters[0]}, ${parameters[1]})`,
      observations: (observationCount) =>
        `rbinom(${observationCount}, ${parameters[0]}, ${parameters[1]})`,
    }),
    parameters: [
      {
        name: "size",
        description: `Number of trials, n`,
        domain: `n an integer ≥ 0`,
        validation: positiveInteger,
        symbol: "n",
        defaultValue: 10,
      },
      {
        name: "prob",
        description: `Probability of success, p`,
        domain: `0 < p < 1`,
        validation: (variable, symbol) => realInRange(variable, 0, 1, symbol),
        symbol: "p",
        defaultValue: 0.5,
      },
    ],
  };
}

class Poisson extends DiscreteDistribution {
  /**
   * @param {float} lambda
   * @requires lambda > 0
   */
  constructor(lambda) {
    super();
    this.lambdaFloat = lambda.toFixed(SUMMARYPRECISION);
    this.lambda = Ratio.fromDecimal(lambda);
    this.lambdaKArray = [Ratio.ONE];
    // This power is not exact, estimate with floating point exponentiation
    this.eNegLambda = Ratio.fromDecimal(
      Math.E ** this.lambda.times(Ratio.fromInt(-1)).toFixed(ESTIMATE_PRECISION)
    );
  }

  /**
   * @param {int} k
   * @returns {Ratio} λ^k
   */
  lambdaK(k) {
    if (this.lambdaKArray.length <= k) {
      this.lambdaKArray.push(this.lambdaK(k - 1).times(this.lambda));
    }
    return this.lambdaKArray[k];
  }

  /**
   * @param {int} x
   * @returns {Ratio} P(X = x) = lambda^k * e^-lambda / k!
   */
  probability(x) {
    return this.lambdaK(x)
      .times(this.eNegLambda)
      .divideBy(Ratio.fromInt(factorial(x)));
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution, this.cdfDistribution] = this.distributionDynamicRange();
  }

  summary() {
    const summaryStatistics = {
      PMF: {
        formula: "P(X=k) = λ^k e^-λ /k!",
        value: `${this.lambdaFloat}^k e^${-this.lambdaFloat} /k!`,
      },
      expectation: {
        formula: "E[X] = λ",
        value: this.lambdaFloat,
      },
      variance: { formula: "Var[X] = λ", value: this.lambdaFloat },
      skewness: {
        formula: "Skew[X] = 1 / sqrt(λ)",
        value: 1 / this.lambdaFloat ** 0.5,
      },
      MGF: { formula: "M_X(t) = exp[λ(e^t - 1)]", value: `exp[${this.lambdaFloat}(e^t - 1)]` },
      CF: { formula: "φ_X(t) = exp[λ(e^it - 1)]", value: `exp[${this.lambdaFloat}(e^it - 1)]` },
      PGF: { formula: "G(z) = exp[λ(z - 1)]", value: `exp[${this.lambdaFloat}(z - 1)]` },
    };
    this.summary = () => summaryStatistics;
    return this.summary();
  }

  static settings = {
    distribution: Poisson,

    title: "Poisson",
    interpretation:
      "Number of events occurring in an interval of time, if these events occur with a known constant mean rate λ, and occur independently of the time since the last event",
    name: (parameters) => `Poisson distribution (λ=${parameters[0]})`,
    rCode: (parameters) => ({
      pdf: `dpois(x, ${parameters[0]})`,
      cdf: `ppois(x, ${parameters[0]})`,
      cdfReverse: `ppois(x, ${parameters[0]}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) => `qpois(${cumulativeProbability}, ${parameters[0]})`,
      observations: (observationCount) => `rpois(${observationCount}, ${parameters[0]})`,
    }),
    parameters: [
      {
        name: "lambda",
        description: `Constant mean rate, λ`,
        domain: `λ > 0`,
        validation: (variable, symbol) => positiveRealNeqZero(variable, 0, Infinity, symbol),
        symbol: "λ",
        defaultValue: 1,
      },
    ],
  };
}

class Geometric extends DiscreteDistribution {
  /**
   * @param {float} prob
   * @requires 0 <= prob <= 1
   */
  constructor(prob) {
    super();
    this.probFloat = prob.toFixed(SUMMARYPRECISION);
    this.prob = Ratio.fromDecimal(prob);
    this.cprob = Ratio.ONE.subtract(this.prob);
    this.cprobKArray = [Ratio.ONE];
  }

  /**
   * @param {int} k
   * @returns {Ratio} (1-p)^k
   */
  cProbK(k) {
    if (this.cprobKArray.length <= k) {
      this.cprobKArray.push(this.cProbK(k - 1).times(this.cprob));
    }
    return this.cprobKArray[k];
  }

  /**
   * @param {int} x
   * @returns {Ratio} P(X = x)
   */
  probability(x) {
    return this.cProbK(x).times(this.prob);
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution, this.cdfDistribution] = this.distributionDynamicRange();
  }

  summary() {
    const summaryStatistics = {
      PMF: {
        formula: "P(X=k) = p(1 - p)^k",
        value: `${this.probFloat}(${1 - this.probFloat})^k `,
      },
      expectation: {
        formula: "E[X] = (1 - p) / p",
        value: ((1 - this.probFloat) / this.probFloat).toFixed(SUMMARYPRECISION),
      },
      variance: {
        formula: "Var[X] = (1 - p) / p^2",
        value: ((1 - this.probFloat) / this.probFloat / this.probFloat).toFixed(SUMMARYPRECISION),
      },
      skewness: {
        formula: "Skew[X] = (2 - p) / sqrt(1 - p)",
        value: ((2 - this.probFloat) / (1 - this.probFloat) ** 0.5).toFixed(SUMMARYPRECISION),
      },
      MGF: {
        formula: "M_X(t) = p / (1 - (1 - p)e^t) for t < -ln(1 - p)",
        value: `${this.probFloat} / (1 - ${1 - this.probFloat}e^t) for t < ${-Math.log(
          1 - this.probFloat
        ).toFixed(SUMMARYPRECISION)}`,
      },
      CF: {
        formula: "φ_X(t) = p / (1 - (1 - p)e^it)",
        value: `${this.probFloat} / (1 - $1-{prob}e^it)`,
      },
      PGF: {
        formula: "G(z) = p / (1 - (1 - p)z)",
        value: `${this.probFloat} / (1 - ${1 - this.probFloat}z)`,
      },
    };
    this.summary = () => summaryStatistics;
    return this.summary();
  }

  static settings = {
    distribution: Geometric,
    title: "Geometric",

    interpretation: "Number of failures before the first success, with success of probability p",
    name: (parameters) => `Geometric distribution (p=${parameters[0]})`,
    rCode: (parameters) => ({
      pdf: `dgeom(x, ${parameters[0]})`,
      cdf: `pgeom(x, ${parameters[0]})`,
      cdfReverse: `pgeom(x, ${parameters[0]}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) => `qgeom(${cumulativeProbability}, ${parameters[0]})`,
      observations: (observationCount) => `rgeom(${observationCount}, ${parameters[0]})`,
    }),
    parameters: [
      {
        name: "prob",
        description: `Probability of success, p`,
        domain: `0 < p < 1`,
        validation: (variable, symbol) => realInRange(variable, 0, 1, symbol),
        symbol: "p",
        defaultValue: 0.6,
      },
    ],
  };
}

class NegativeBinomial extends DiscreteDistribution {
  /**
   * @param {int} size
   * @param {float} prob
   * @requires 0 < size
   * @requires 0 <= prob <= 1
   */
  constructor(size, prob) {
    super();
    this.size = size;
    this.probFloat = prob.toFixed(SUMMARYPRECISION);
    this.prob = Ratio.fromDecimal(prob);
    this.cprob = Ratio.ONE.subtract(this.prob);

    this.pKArray = [Ratio.ONE];
    this.cpKArray = [Ratio.ONE];
  }

  /**
   * @param {int} k
   * @returns {Ratio} p^k
   */
  pK(k) {
    if (this.pKArray.length <= k) {
      this.pKArray.push(this.pK(k - 1).times(this.prob));
    }
    return this.pKArray[k];
  }

  /**
   * @param {int} k
   * @returns {Ratio} (1-p)^k
   */
  cpK(k) {
    if (this.cpKArray.length <= k) {
      this.cpKArray.push(this.cpK(k - 1).times(this.cprob));
    }
    return this.cpKArray[k];
  }

  /**
   * @param {int} x
   * @returns {Ratio} P(X = x)
   */
  probability(x) {
    return new Ratio(combination(x + this.size - 1, x))
      .times(this.cpK(x))
      .times(this.pK(this.size));
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution, this.cdfDistribution] = this.distributionDynamicRange();
  }

  summary() {
    const cprob = 1 - this.probFloat;
    const summaryStatistics = {
      PMF: {
        formula: "P(X=k) = (k+1-r)Ck (1-p)^k p^r",
        value: `(k-${this.size - 1})Ck ${cprob}^k ${this.probFloat}^(${this.size})`,
      },
      expectation: {
        formula: "E[X] = r(1 - p) / p",
        value: (this.size * cprob) / this.probFloat,
      },
      variance: {
        formula: "Var[X] = r(1 - p) / p^2",
        value: (this.size * cprob) / this.probFloat / this.probFloat,
      },
      skewness: {
        formula: "Skew[X] = (2 - p) / sqrt((1 - p)r)",
        value: ((2 - this.probFloat) / (cprob * this.size) ** 0.5).toFixed(SUMMARYPRECISION),
      },
      MGF: {
        formula: "M_X(t) = (p/(1 - (1 - p)e^t))^r",
        value: `(${this.probFloat}/(1-${this.cprob}e^t))^${this.size}`,
      },
      CF: {
        formula: "φ_X(t) = (p/(1 - (1 - p)e^it))^r",
        value: `(${this.probFloat}/(1-${this.cprob}e^it))^${this.size}`,
      },
      PGF: {
        formula: "G(z) = (p/(1 - (1 - p)z))^r",
        value: `(${this.probFloat}/(1-${this.cprob}z))^${this.size}`,
      },
    };
    this.summary = () => summaryStatistics;
    return this.summary();
  }

  static settings = {
    distribution: NegativeBinomial,
    title: "Negative Binomial",

    interpretation:
      "Number of failures in a sequence of independent and identically distributed Bernoulli trials with success of probability p, before a fixed number r of scucesses occur",
    name: (parameters) => `Negative Binomial distribution (r=${parameters[0]}, p=${parameters[1]})`,
    rCode: (parameters) => ({
      pdf: `dnbinom(x, ${parameters[0]}, ${parameters[1]})`,
      cdf: `pnbinom(x, ${parameters[0]}, ${parameters[1]})`,
      cdfReverse: `pnbinom(x, ${parameters[0]}, ${parameters[1]}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) =>
        `qnbinom(${cumulativeProbability}, ${parameters[0]}, ${parameters[1]})`,
      observations: (observationCount) =>
        `rnbinom(${observationCount}, ${parameters[0]}, ${parameters[1]})`,
    }),
    parameters: [
      {
        name: "size",
        description: `Number of successes, r`,
        domain: `r an integer > 0`,
        validation: positiveIntegerNeqZero,
        symbol: "r",
        defaultValue: 5,
      },
      {
        name: "prob",
        description: `Probability of success, p`,
        domain: `0 < p < 1`,
        validation: (variable, symbol) => realInRange(variable, 0, 1, symbol),
        symbol: "p",
        defaultValue: 0.5,
      },
    ],
  };
}

class Hypergeometric extends DiscreteDistribution {
  /**
   * @param {int} size
   * @param {int} successStates
   * @param {int} draws
   * @requires 0 <= successStates <= size
   * @requires 0 <= draws <= size
   */
  constructor(size, successStates, draws) {
    super();
    this.size = size;
    this.successStates = successStates;
    this.draws = draws;
  }

  /**
   * @param {int} x
   * @returns {Ratio} P(X = x)
   */
  probability(x) {
    if (
      x < 0 ||
      x < this.draws + this.successStates - this.size ||
      x > this.draws ||
      x > this.successStates
    ) {
      return Ratio.ZERO;
    }
    return new Ratio(
      combination(this.successStates, x) *
        combination(this.size - this.successStates, this.draws - x)
    ).divideBy(new Ratio(combination(this.size, this.draws)));
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution, this.cdfDistribution] = this.distributionSetRange(
      Math.min(this.draws, this.successStates)
    );
  }

  summary() {
    const summaryStatistics = {
      PMF: {
        formula: "P(X=k) = KCk (N-K)C(n-k) / NCn",
        value: `${this.successStates}Ck ${this.size - this.successStates}C(${
          this.draws
        }-k) / ${combination(this.size, this.draws)}`,
      },
      expectation: {
        formula: "E[X] = nK/N",
        value: (this.draws * this.successStates) / this.size,
      },
      variance: {
        formula: "Var[X] = n K/N (N-K)/N (N-n)/(N-1)",
        value: (
          this.draws *
          (this.successStates / this.size) *
          ((this.size - this.successStates) / this.size) *
          ((this.size - this.draws) / (this.size - 1))
        ).toFixed(SUMMARYPRECISION),
      },
      skewness: {
        formula: "Skew[X] = (N - 2K)(N - 1)^1/2 (N - 2n) / {[nK(N - K)(N - n)]^1/2 (N-2)}",
        value: (
          ((this.size - 2 * this.successStates) *
            (this.size - 1) ** 0.5 *
            (this.size - 2 * this.draws)) /
          (this.draws *
            this.successStates *
            (this.size - this.successStates) *
            (this.size - this.draws)) **
            0.5 /
          (this.size - 2)
        ).toFixed(SUMMARYPRECISION),
      },
    };
    this.summary = () => summaryStatistics;
    return this.summary();
  }

  static settings = {
    distribution: Hypergeometric,
    title: "Hypergeometric",

    interpretation:
      "Number of successes in n draws, without replacement, from a population of size N with exactly K objects with the success feature",
    name: (parameters) =>
      `Hypergeometric distribution (N=${parameters[0]}, K=${parameters[1]}, n=${parameters[2]})`,
    rCode: (parameters) => ({
      pdf: `dhyper(x, ${parameters[1]}, ${parameters[0] - parameters[1]}, ${parameters[2]})`,
      cdf: `phyper(x, ${parameters[1]}, ${parameters[0] - parameters[1]}, ${parameters[2]})`,
      cdfReverse: `phyper(x, ${parameters[1]}, ${parameters[0] - parameters[1]}, ${
        parameters[2]
      }, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) =>
        `qhyper(${cumulativeProbability}, ${parameters[1]}, ${parameters[0] - parameters[1]}, ${
          parameters[2]
        })`,
      observations: (observationCount) =>
        `rhyper(${observationCount}, ${parameters[1]}, ${parameters[0] - parameters[1]}, ${
          parameters[2]
        })`,
    }),
    parameters: [
      {
        name: "size",
        description: `Population size, N`,
        domain: `N an integer ≥ 0`,
        validation: positiveInteger,
        symbol: "N",
        defaultValue: 20,
      },
      {
        name: "success-states",
        description: `Number of success states in the population, K`,
        domain: `0 ≤ K ≤ N`,
        validation: positiveInteger, // Doesn't check for <=N
        symbol: "K",
        defaultValue: 10,
      },
      {
        name: "draws",
        description: `Number of draws, n`,
        domain: `0 < n ≤ N`,
        validation: positiveInteger, // Doesn't check for <=N
        symbol: "n",
        defaultValue: 10,
      },
    ],
  };
}

class ContinuousDistribution {
  DATAPOINTS = 21;
  TYPE = "continuous";
  static MAX_X_PRECISION = 5;
  static PREFERRED_X_PRECISION = 1;

  /**
   * @param {Ratio} maxX
   * @param {Ratio} minX
   * @returns [[[float x, Ratio f(x)]] pdf, [[float x, Ratio F(x)]] cdf]
   */
  distributionSetRange(maxX, minX = Ratio.ZERO, minF = Ratio.ZERO) {
    const increment = maxX.subtract(minX).divideBy(Ratio.fromInt(this.DATAPOINTS - 1));
    const halfIncrement = increment.divideBy(Ratio.fromInt(2));
    const sixthIncrement = increment.divideBy(Ratio.fromInt(6));

    const precision = Math.min(
      ContinuousDistribution.MAX_X_PRECISION,
      Math.max(increment.decimalCount(), maxX.decimalCount(), minX.decimalCount())
    );

    let previous = this.probability(minX);
    let cumulative = minF;
    const minXFloat = Number(minX.toFixed(precision));
    const pdf = [[minXFloat, previous]];
    const cdf = [[minXFloat, minF]];
    for (
      let x = minX.add(increment), counter = 1;
      counter < this.DATAPOINTS;
      x = x.add(increment), counter++
    ) {
      const p = this.probability(x);
      const xRounded = Number(x.toFixed(precision));
      pdf.push([xRounded, p]);
      cumulative = this.probability(x.subtract(halfIncrement))
        .times(Ratio.fromInt(4))
        .add(previous)
        .add(p)
        .times(sixthIncrement)
        .add(cumulative); // Simpson's rule
      cdf.push([xRounded, cumulative]);
      previous = p;
    }
    return [pdf, cdf];
  }

  /**
   * @param {Ratio} maxX
   * @param {Ratio} centreX
   * @returns [[[float x, Ratio f(x)]] pdf, [[float x, Ratio F(x)]] cdf]
   */
  distributionSetRangeSymmetric(maxX, centreX = Ratio.ZERO) {
    const datapoints = Math.floor(this.DATAPOINTS / 2) * 2;
    const increment = maxX
      .subtract(centreX)
      .times(Ratio.fromInt(2))
      .divideBy(Ratio.fromInt(datapoints));
    const halfIncrement = increment.divideBy(Ratio.fromInt(2));
    const sixthIncrement = increment.divideBy(Ratio.fromInt(6));

    const precision = Math.min(
      ContinuousDistribution.MAX_X_PRECISION,
      Math.max(increment.decimalCount(), maxX.decimalCount(), centreX.decimalCount())
    );

    let previous = this.probability(centreX);
    let cumulative = Ratio.fromDecimal(1 / 2);
    const centerXFloat = Number(centreX.toFixed(precision));
    let pdf = [[centerXFloat, previous]];
    let cdf = [[centerXFloat, cumulative]];
    for (
      let x = centreX.add(increment), counter = 0;
      counter < datapoints;
      x = x.add(increment), counter += 2
    ) {
      const p = this.probability(x);
      const xRounded = Number(x.toFixed(precision));
      pdf.push([xRounded, p]);
      cumulative = this.probability(x.subtract(halfIncrement))
        .times(Ratio.fromInt(4))
        .add(previous)
        .add(p)
        .times(sixthIncrement)
        .add(cumulative); // Simpson's rule
      cdf.push([xRounded, cumulative]);
      previous = p;
    }

    pdf = pdf
      .slice(1)
      .reverse()
      .map(([x, p]) => [Number((-x + centerXFloat + centerXFloat).toFixed(precision)), p])
      .concat(pdf);
    cdf = cdf
      .slice(1)
      .reverse()
      .map(([x, p]) => [
        Number((-x + centerXFloat + centerXFloat).toFixed(precision)),
        Ratio.ONE.subtract(p),
      ])
      .concat(cdf);
    return [pdf, cdf];
  }

  /**
   * @param {Ratio} increment
   * @param {Ratio} minX
   * @returns [[[float x, Ratio f(x)]] pdf, [[float x, Ratio F(x)]] cdf]
   */
  distributionSetIncrement(increment, minX = Ratio.ZERO, minF = Ratio.ZERO) {
    const halfIncrement = increment.divideBy(Ratio.fromInt(2));
    const sixthIncrement = increment.divideBy(Ratio.fromInt(6));

    const precision = Math.min(
      ContinuousDistribution.MAX_X_PRECISION,
      Math.max(increment.decimalCount(), minX.decimalCount())
    );

    let previous = this.probability(minX);
    let cumulative = minF;
    const minXFloat = Number(minX.toFixed(precision));
    const pdf = [[minXFloat, previous]];
    const cdf = [[minXFloat, minF]];
    for (
      let x = minX.add(increment), counter = 1;
      counter < this.DATAPOINTS;
      x = x.add(increment), counter++
    ) {
      const p = this.probability(x);
      const xRounded = Number(x.toFixed(precision));
      pdf.push([xRounded, p]);
      cumulative = this.probability(x.subtract(halfIncrement))
        .times(Ratio.fromInt(4))
        .add(previous)
        .add(p)
        .times(sixthIncrement)
        .add(cumulative); // Simpson's rule
      cdf.push([xRounded, cumulative]);
      previous = p;
    }
    return [pdf, cdf];
  }

  /**
   * Sets pdf+cdf if not already set
   * @returns {<array[Ratio]>} pdf P(X = x) forall x
   */
  pdf() {
    if (typeof this.pdfDistribution === "undefined") {
      this.setDistribution();
    }
    this.pdf = () => this.pdfDistribution;
    return this.pdfDistribution;
  }

  /**
   * Sets pdf+cdf if not already set
   * @returns {<array[Ratio]>} cdf P(X <= x) for all x
   */
  cdf() {
    if (typeof this.cdfDistribution === "undefined") {
      this.setDistribution();
    }
    this.cdf = () => this.cdfDistribution;
    return this.cdfDistribution;
  }

  /**
   * Very rough estimate, depends on precision of CDF. Ideally override with more accurate one.
   * @param {float} cumulativeProbability
   * @returns {float} Quantile of distribution at cumulativeProbability
   */
  quantile(cumulativeProbability) {
    if (typeof this.cdfDistribution === "undefined") {
      this.setDistribution();
    }
    this.quantile = (cumulativeProbability) => {
      const cumulative = Ratio.fromDecimal(cumulativeProbability);
      let q = 0;
      while (true) {
        if (this.cdfDistribution[q].gt(cumulative) || q === this.cdfDistribution.length) {
          return this.cdfDistribution[q];
        }
        q++;
      }
    };
    return this.quantile(cumulativeProbability);
  }

  /**
   * @param {int} count
   * @returns {array[float]} Array of <count> random observations from distribution
   */
  observe(count = 1) {
    const observations = [];
    for (let i = 0; i < count; i++) {
      observations.push(this.quantile(Math.random()));
    }
    return observations;
  }

  // TODO: Temporary
  summary() {
    return {};
  }
}

class Normal extends ContinuousDistribution {
  /**
   * @param {float} mean
   * @param {float} variance
   */
  constructor(mean, variance) {
    super();
    this.mean = Ratio.fromDecimal(mean);
    this.meanFloat = mean;
    this.variance = Ratio.fromDecimal(variance);
    this.standardDeviationFloat = variance ** 0.5;
    this.standardDeviation = Ratio.fromDecimal(this.standardDeviationFloat);
    this.twoVariance = Ratio.fromDecimal(2 * variance); // 2sigma^2
    this.correctionFactor = Ratio.ONE.divideBy(
      Ratio.fromDecimal(Ratio.PI.times(this.twoVariance).toFixed(ESTIMATE_PRECISION) ** 0.5)
    ); // 1 / sqrt(2 PI sigma^2)
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * @param {Ratio} x
   * @returns {Ratio} P(X = x) = [1 / sqrt(2 PI sigma^2)] * exp(-(x-mu)^2 / 2sigma^2)
   */
  probability(x) {
    const xMinusMu = x.subtract(this.mean);
    return Ratio.fromDecimal(
      Math.E ** -xMinusMu.times(xMinusMu).divideBy(this.twoVariance).toFixed(ESTIMATE_PRECISION)
    ).times(this.correctionFactor);
  }

  /**
   * @returns {[Ratio domainMin, Ratio FMin]}
   * domainMin = lower value of domain to be displayed
   * FMin = P(X <= domainMin)
   */
  min() {
    const domainMin = this.mean.subtract(this.standardDeviation.times(Ratio.fromInt(3)));
    const FMin = Ratio.fromDecimal(0.0013499);
    this.min = () => {
      return [domainMin, FMin];
    };
    return this.min();
  }

  /**
   * @returns {[Ratio domainMax, Ratio FMax]}
   * domainMax = upper value of domain to be displayed
   * FMax = P(X >= domainMax)
   */
  max() {
    const domainMax = this.mean.add(this.standardDeviation.times(Ratio.fromInt(3)));
    const FMax = Ratio.fromDecimal(0.9986501);
    this.max = () => {
      return [domainMax, FMax];
    };
    return this.max();
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution, this.cdfDistribution] = this.distributionSetRangeSymmetric(
      this.max()[0],
      this.mean
    );
  }

  /**
   * Beasley-Springer-Moro approximation
   * @param {float} cumulativeProbability
   * @requires 0 <= cumulativeProbability <= 1
   * @returns {float} Quantile of distribution at cumulativeProbability
   */
  quantile(cumulativeProbability) {
    // Coefficients in rational approximations
    const a = [
      -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
      -3.066479806614716e1, 2.506628277459239,
    ];

    const b = [
      -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
      -1.328068155288572e1,
    ];

    const c = [
      -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
      4.374664141464968, 2.938163982698783,
    ];

    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

    // Define break-points
    const plow = 0.02425;
    const phigh = 1 - plow;
    let q, r;

    if (cumulativeProbability < plow) {
      // Rational approximation for lower region
      q = Math.sqrt(-2 * Math.log(cumulativeProbability));
      return (
        this.meanFloat +
        this.standardDeviationFloat *
          ((((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1))
      );
    } else if (cumulativeProbability > phigh) {
      // Rational approximation for upper region
      q = Math.sqrt(-2 * Math.log(1 - cumulativeProbability));
      return (
        this.meanFloat -
        this.standardDeviationFloat *
          ((((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1))
      );
    } else {
      // Rational approximation for central region
      q = cumulativeProbability - 0.5;
      r = q * q;
      return (
        this.meanFloat +
        this.standardDeviationFloat *
          (((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
            (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1))
      );
    }
  }

  /**
   * @param {int} count
   * @returns {array[float]} Array of <count> random observations from distribution
   * Using Box-Muller transform
   */
  observe(count = 1) {
    const observations = [];
    for (let i = 0; i < count; i += 2) {
      const r = (-2 * Math.log(Math.random())) ** 0.5 * this.standardDeviationFloat;
      const theta = 2 * Math.PI * Math.random();
      observations.push(r * Math.cos(theta) + this.meanFloat);
      observations.push(r * Math.sin(theta) + this.meanFloat);
    }
    if (count % 2) {
      observations.pop();
    }
    return observations;
  }

  static settings = {
    distribution: Normal,
    title: "Normal",
    interpretation:
      "The central limit theorem states that, under appropriate conditions, the distribution of a normalized version of the sample mean converges to a standard normal distribution",
    name: (parameters) => `Normal distribution (μ=${parameters[0]}, σ^2=${parameters[1]})`,
    rCode: (parameters) => ({
      pdf: `dnorm(x, ${parameters[0]}, ${parameters[1]})`,
      cdf: `pnorm(x, ${parameters[0]}, ${parameters[1]})`,
      cdfReverse: `pnorm(x, ${parameters[0]}, ${parameters[1]}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) =>
        `qnorm(${cumulativeProbability}, ${parameters[0]}, ${parameters[1]})`,
      observations: (observationCount) =>
        `rnorm(${observationCount}, ${parameters[0]}, ${parameters[1]})`,
    }),
    parameters: [
      {
        name: "mean",
        description: `Mean, μ`,
        domain: ``,
        validation: real,
        symbol: "μ",
        defaultValue: 0,
      },
      {
        name: "variance",
        description: `Variance, σ^2`,
        domain: `σ^2 > 0`,
        validation: positiveRealNeqZero,
        symbol: "σ^2",
        defaultValue: 1,
      },
    ],
  };
}

class Uniform extends ContinuousDistribution {
  /**
   * @param {float} min
   * @param {float} max
   */
  constructor(min, max) {
    super();
    this.min = Ratio.fromDecimal(min);
    this.minFloat = min;
    this.max = Ratio.fromDecimal(max);
    this.maxFloat = max;
    this.domainSize = max - min;
    this.prob = Ratio.ONE.divideBy(this.max.subtract(this.min)); // 1/(b-a)
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * @param {Ratio} x
   * @returns {Ratio} P(X = x) = 1/(b-a) if a <= x <= b, 0 otherwise
   */
  probability(x) {
    if (x.lt(this.min) || x.gt(this.max)) {
      return Ratio.ZERO;
    }
    return this.prob;
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution, this.cdfDistribution] = this.distributionSetRange(this.max, this.min);
  }

  /**
   * @param {float} cumulativeProbability
   * @requires 0 <= cumulativeProbability <= 1
   * @returns {float} Quantile of distribution at cumulativeProbability
   * X(F(X) = cumulativeProbability) = (b-a)p + a
   */
  quantile(cumulativeProbability) {
    return this.domainSize * cumulativeProbability + this.minFloat;
  }

  static settings = {
    distribution: Uniform,
    title: "Uniform",
    interpretation: "An arbitrary outcome that lies between the bounds",
    name: (parameters) => `Uniform distribution [a=${parameters[0]}, b=${parameters[1]}]`,
    rCode: (parameters) => ({
      pdf: `dunif(x, ${parameters[0]}, ${parameters[1]})`,
      cdf: `punif(x, ${parameters[0]}, ${parameters[1]})`,
      cdfReverse: `punif(x, ${parameters[0]}, ${parameters[1]}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) =>
        `qunif(${cumulativeProbability}, ${parameters[0]}, ${parameters[1]})`,
      observations: (observationCount) =>
        `runif(${observationCount}, ${parameters[0]}, ${parameters[1]})`,
    }),
    parameters: [
      {
        name: "min",
        description: `Min, a`,
        domain: ``,
        validation: real,
        symbol: "a",
        defaultValue: 0,
      },
      {
        name: "max",
        description: `Max, b`,
        domain: `a < b`, // NOTE: This condition is not checked
        validation: real,
        symbol: "b",
        defaultValue: 1,
      },
    ],
  };
}

class Exponential extends ContinuousDistribution {
  /**
   * @param {float} rate
   * @requires rate > 0
   */
  constructor(rate) {
    super();
    this.rate = Ratio.fromDecimal(rate);
    this.rateFloat = rate;
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * @param {Ratio} x
   * @returns {Ratio} P(X = x) = lambda exp(-lambda x)
   */
  probability(x) {
    return Ratio.fromDecimal(Math.E ** -this.rate.times(x).toFixed(ESTIMATE_PRECISION)).times(
      this.rate
    );
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    const maxX = Ratio.fromDecimal(this.quantile(0.99));
    const increment = maxX.divideBy(Ratio.fromInt(this.DATAPOINTS - 1)).toFixed(ESTIMATE_PRECISION);
    const roundedIncrement = Number(increment).toPrecision(
      ContinuousDistribution.PREFERRED_X_PRECISION
    );
    [this.pdfDistribution, this.cdfDistribution] = this.distributionSetIncrement(
      Ratio.fromDecimal(Number(roundedIncrement))
    );
  }

  /**
   * @param {float} cumulativeProbability
   * @requires 0 <= cumulativeProbability <= 1
   * @returns {float} Quantile of distribution at cumulativeProbability
   * X(F(X) = cumulativeProbability) = -ln(1 - p)/lambda
   */
  quantile(cumulativeProbability) {
    return -Math.log(1 - cumulativeProbability) / this.rateFloat;
  }

  static settings = {
    distribution: Exponential,
    title: "Exponential",
    interpretation: "An arbitrary outcome that lies between the bounds",
    name: (parameters) => `Exponential distribution [λ=${parameters[0]}]`,
    rCode: (parameters) => ({
      pdf: `dexp(x, ${parameters[0]})`,
      cdf: `pexp(x, ${parameters[0]})`,
      cdfReverse: `pexp(x, ${parameters[0]}}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) => `qexp(${cumulativeProbability}, ${parameters[0]})`,
      observations: (observationCount) => `rexp(${observationCount}, ${parameters[0]})`,
    }),
    parameters: [
      {
        name: "rate",
        description: `Rate, λ`,
        domain: `λ > 0`,
        validation: positiveRealNeqZero,
        symbol: "λ",
        defaultValue: 1,
      },
    ],
  };
}

export const distributionSettings = {
  binomial: Binomial.settings,
  poisson: Poisson.settings,
  geometric: Geometric.settings,
  negativeBinomial: NegativeBinomial.settings,
  hypergeometric: Hypergeometric.settings,
  normal: Normal.settings,
  uniform: Uniform.settings,
  exponential: Exponential.settings,
};
