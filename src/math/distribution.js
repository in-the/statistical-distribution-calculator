import {
  beta,
  combination,
  factorial,
  gamma,
  lowerIncompleteGamma,
  regularisedIncompleteBeta,
  regularisedIncompleteBetaInverse,
} from "./math";
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

class DiscreteDistribution {
  TYPE = "discrete";
  PRECISION = 5;

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
    for (let x = min; cumulative.toValue(this.PRECISION) < 1; x++) {
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
      const cumulative = Ratio.fromNumber(cumulativeProbability);
      let q = 0;
      while (true) {
        if (this.cdfDistribution[q].gte(cumulative) || q === this.cdfDistribution.length) {
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
    if (!this.observations) {
      this.observations = this.cdf().map((x) => 0);
      this.observations.count = 0;
    }

    const observations = [];
    for (let i = 0; i < count; i++) {
      const observation = this.quantile(Math.random());
      observations.push(observation);
      this.observations[observation]
        ? this.observations[observation]++
        : (this.observations[observation] = 1);
      this.observations.count++;
    }
    return observations;
  }

  observationFrequency() {
    return [this.observations, this.observations.map((count) => count / this.observations.count)];
  }

  observationCumulative() {
    const observationCumulative = this.observations.map(
      (
        (accumulation) => (count) =>
          (accumulation += count)
      )(0)
    );
    return [
      observationCumulative,
      observationCumulative.map((count) => count / this.observations.count),
    ];
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
    this.probFloat = prob;
    this.prob = Ratio.fromNumber(prob);

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
    name: (parameters) => `B(n=${parameters[0]}, p=${parameters[1]})`,
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
    this.lambdaFloat = lambda;
    this.lambda = Ratio.fromNumber(lambda);
    this.lambdaKArray = [Ratio.ONE];
    this.eNegLambda = this.lambda.times(Ratio.fromInt(-1)).powOf(Math.E); // e^-lambda
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
   * TODO: Problem when lambda >= 14??
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
    name: (parameters) => `Pois(λ=${parameters[0]})`,
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
    this.probFloat = prob;
    this.prob = Ratio.fromNumber(prob);
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
    name: (parameters) => `Geom(p=${parameters[0]})`,
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
    this.probFloat = prob;
    this.prob = Ratio.fromNumber(prob);
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
    name: (parameters) => `NB(r=${parameters[0]}, p=${parameters[1]})`,
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
      `Hypergeometric(N=${parameters[0]}, K=${parameters[1]}, n=${parameters[2]})`,
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
  PRECISION = 5;
  EDGE = Ratio.fromNumber(0.01);
  static MAX_X_PRECISION = 5;
  static PREFERRED_X_PRECISION = 2;
  observations = [];

  /**
   * @param {Ratio} maxX
   * @param {Ratio} minX
   * @param {Ratio} minF P(X <= minX)
   * @param {boolean} calculateCdf
   * @param {boolean} edges
   * @requires edges true only if calculateCdf true
   * @returns [[[float x, Ratio f(x)]] pdf, [[float x, Ratio F(x)]] cdf]
   */
  distributionSetRange(
    maxX,
    minX = Ratio.ZERO,
    minF = Ratio.ZERO,
    calculateCdf = true,
    edges = true
  ) {
    const increment = maxX.subtract(minX).divideBy(Ratio.fromInt(this.DATAPOINTS - 1));
    const halfIncrement = increment.divideBy(Ratio.fromInt(2));
    const sixthIncrement = increment.divideBy(Ratio.fromInt(6));

    const precision = Math.min(
      ContinuousDistribution.MAX_X_PRECISION,
      Math.max(increment.decimalCount(), maxX.decimalCount(), minX.decimalCount())
    );

    let previous, cumulative, minXFloat, cdf;
    if (edges) {
      previous = this.probability(minX);
      cumulative = minF;
      minXFloat = minX.toValue(precision);
      cdf = [[minXFloat, minF]];
    } else {
      previous = this.probability(this.EDGE);
      minXFloat = this.EDGE.toValue(precision);
    }
    const pdf = [[minXFloat, previous]];
    for (
      let x = minX.add(increment), counter = 1;
      counter < this.DATAPOINTS;
      x = x.add(increment), counter++
    ) {
      if (!edges && counter === this.DATAPOINTS - 1) {
        x = maxX.subtract(this.EDGE);
      }
      const xRounded = x.toValue(precision);
      pdf.push([xRounded, this.probability(Ratio.fromNumber(xRounded))]);
      if (calculateCdf) {
        const p = this.probability(x);
        cumulative = this.probability(x.subtract(halfIncrement))
          .times(Ratio.fromInt(4))
          .add(previous)
          .add(p)
          .times(sixthIncrement)
          .add(cumulative); // Simpson's rule
        cdf.push([xRounded, cumulative]);
        previous = p;
      }
    }
    return [pdf, cdf];
  }

  /**
   * @param {Ratio} maxX
   * @param {Ratio} centreX
   * @returns [[[float x, Ratio f(x)]] pdf, [[float x, Ratio F(x)]] cdf]
   */
  distributionSetRangeSymmetric(maxX, centreX = Ratio.ZERO, calculateCdf = true) {
    const datapoints = Math.floor(this.DATAPOINTS / 2) * 2;
    const rawIncrement = maxX
      .subtract(centreX)
      .times(Ratio.fromInt(2))
      .divideBy(Ratio.fromInt(datapoints))
      .toValue();
    const roundedIncrement = rawIncrement.toPrecision(ContinuousDistribution.PREFERRED_X_PRECISION);
    const increment = Ratio.fromNumber(Number(roundedIncrement));
    const halfIncrement = increment.divideBy(Ratio.fromInt(2));
    const sixthIncrement = increment.divideBy(Ratio.fromInt(6));

    const precision = Math.min(
      ContinuousDistribution.MAX_X_PRECISION,
      Math.max(increment.decimalCount(), maxX.decimalCount(), centreX.decimalCount())
    );

    let previous = this.probability(centreX);
    let cumulative = Ratio.fromNumber(1 / 2);
    const centerXFloat = centreX.toValue(precision);
    let pdf = [[centerXFloat, previous]];
    let cdf = [[centerXFloat, cumulative]];
    for (
      let x = centreX.add(increment), counter = 0;
      counter < datapoints;
      x = x.add(increment), counter += 2
    ) {
      const xRounded = Number(x.toFixed(precision));
      pdf.push([xRounded, this.probability(Ratio.fromNumber(xRounded))]);
      if (calculateCdf) {
        const p = this.probability(x);
        cumulative = this.probability(x.subtract(halfIncrement))
          .times(Ratio.fromInt(4))
          .add(previous)
          .add(p)
          .times(sixthIncrement)
          .add(cumulative); // Simpson's rule
        cdf.push([xRounded, cumulative]);
        previous = p;
      }
    }

    pdf = pdf
      .slice(1)
      .reverse()
      .map(([x, p]) => [Number((-x + centerXFloat + centerXFloat).toFixed(precision)), p])
      .concat(pdf);

    if (calculateCdf) {
      cdf = cdf
        .slice(1)
        .reverse()
        .map(([x, p]) => [
          Number((-x + centerXFloat + centerXFloat).toFixed(precision)),
          Ratio.ONE.subtract(p),
        ])
        .concat(cdf);
    }
    return [pdf, cdf];
  }

  /**
   * Requires explicit this.quantile(p) function
   * @param {float} quantile
   * @param {Ratio} minX
   * @returns [[[float x, Ratio f(x)]] pdf, [[float x, Ratio F(x)]] cdf]
   */
  distributionSetQuantile(
    minX = Ratio.ZERO,
    quantile = 0.99,
    minF = Ratio.ZERO,
    calculateCdf = true,
    maxX = Ratio.INFINITY
  ) {
    maxX = Ratio.fromNumber(this.quantile(quantile)).min(maxX);
    const rawIncrement = maxX.divideBy(Ratio.fromInt(this.DATAPOINTS - 1)).toValue();
    const roundedIncrement = rawIncrement.toPrecision(ContinuousDistribution.PREFERRED_X_PRECISION);
    const increment = Ratio.fromNumber(Number(roundedIncrement));
    return this.distributionSetIncrement(increment, minX, minF, calculateCdf);
  }

  /**
   * @param {Ratio} increment
   * @param {Ratio} minX
   * @param {Ratio} minF
   * @returns [[[float x, Ratio f(x)]] pdf, [[float x, Ratio F(x)]] cdf]
   */
  distributionSetIncrement(increment, minX = Ratio.ZERO, minF = Ratio.ZERO, calculateCdf = true) {
    const halfIncrement = increment.divideBy(Ratio.fromInt(2));
    const sixthIncrement = increment.divideBy(Ratio.fromInt(6));

    const precision = Math.min(
      ContinuousDistribution.MAX_X_PRECISION,
      Math.max(increment.decimalCount(), minX.decimalCount())
    );

    let previous = this.probability(minX);
    let cumulative = minF;
    const minXFloat = minX.toValue(precision);
    const pdf = [[minXFloat, previous]];
    const cdf = [[minXFloat, minF]];
    if (minX.lt(increment)) minX = Ratio.ZERO;
    for (
      let x = minX.add(increment), counter = 1;
      counter < this.DATAPOINTS;
      x = x.add(increment), counter++
    ) {
      const xRounded = Number(x.toFixed(precision));
      pdf.push([xRounded, this.probability(Ratio.fromNumber(x.toValue(precision)))]);
      if (calculateCdf) {
        const p = this.probability(x);
        cumulative = this.probability(x.subtract(halfIncrement))
          .times(Ratio.fromInt(4))
          .add(previous)
          .add(p)
          .times(sixthIncrement)
          .add(cumulative); // Simpson's rule
        cdf.push([xRounded, cumulative]);
        previous = p;
      }
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
   * Requires explicit this.cumulative(x) function
   */
  updateCdf() {
    this.cdfDistribution = this.pdfDistribution.map(([x, _]) => [
      x,
      this.cumulative(Ratio.fromNumber(x)),
    ]);
  }

  /**
   * @param {float} cumulativeProbability
   * @requires 0 <= cumulativeProbability <= 1
   * @returns {float} Quantile of distribution at cumulativeProbability
   */
  quantile(cumulativeProbability) {
    return this.quantileEstimate(Ratio.fromNumber(cumulativeProbability)).toValue();
  }

  /**
   * Very rough estimate, depends on precision of CDF. Should override
   * @param {float} cumulativeProbability
   * @returns {float} Quantile of distribution at cumulativeProbability
   */
  // quantileRough(cumulativeProbability) {
  //   if (typeof this.cdfDistribution === "undefined") {
  //     this.setDistribution();
  //   }
  //   const cumulative = Ratio.fromNumber(cumulativeProbability);
  //   let q = 0;
  //   while (true) {
  //     if (this.cdfDistribution[q][1].gte(cumulative) || q === this.cdfDistribution.length) {
  //       return this.cdfDistribution[q][0];
  //     }
  //     q++;
  //   }
  // }

  /**
   * Estimate based on this.cumulative(x)
   * @param {Ratio} cumulativeProbability
   * @param {Ratio} precision
   * @requires this.cumulative(x) is defined
   * @returns {Ratio} Quantile of distribution at cumulativeProbability
   */
  quantileEstimate(cumulativeProbability, estimate = Ratio.ONE) {
    let min = Ratio.ZERO;
    let max = undefined;
    let cumulative = this.cumulative(estimate);
    while (
      cumulative
        .subtract(cumulativeProbability)
        .abs()
        .gt(Ratio.fromNumber(10 ** -this.PRECISION))
    ) {
      if (cumulative.gt(cumulativeProbability)) {
        max = estimate;
        estimate = estimate.add(min).divideBy(Ratio.fromInt(2));
      } else {
        min = estimate;
        if (typeof max === "undefined") {
          estimate = estimate.times(Ratio.fromInt(2));
        } else {
          estimate = estimate.add(max).divideBy(Ratio.fromInt(2));
        }
      }
      cumulative = this.cumulative(estimate);
    }
    return estimate;
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
    this.observations.push(...observations);
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
    this.mean = Ratio.fromNumber(mean);
    this.meanFloat = mean;
    this.variance = Ratio.fromNumber(variance);
    this.standardDeviationFloat = variance ** 0.5;
    this.standardDeviation = Ratio.fromNumber(this.standardDeviationFloat);
    this.twoVariance = Ratio.fromNumber(2 * variance); // 2sigma^2
    this.correctionFactor = Ratio.PI.times(this.twoVariance).powFloat(0.5).invert(); // 1 / sqrt(2 PI sigma^2)
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * @param {Ratio} x
   * @returns {Ratio} P(X = x) = [1 / sqrt(2 PI sigma^2)] * exp(-(x-mu)^2 / 2sigma^2)
   */
  probability(x) {
    const xMinusMu = x.subtract(this.mean);
    return xMinusMu
      .times(xMinusMu)
      .divideBy(this.twoVariance)
      .negative()
      .powOf(Math.E)
      .times(this.correctionFactor);
  }

  /**
   * @returns {[Ratio domainMin, Ratio FMin]}
   * domainMin = lower value of domain to be displayed
   * FMin = P(X <= domainMin)
   */
  min() {
    const domainMin = this.mean.subtract(this.standardDeviation.times(Ratio.fromInt(3)));
    const FMin = Ratio.fromNumber(0.0013499);
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
    const FMax = Ratio.fromNumber(0.9986501);
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
    this.observations.push(...observations);
    return observations;
  }

  static settings = {
    distribution: Normal,
    title: "Normal",
    interpretation:
      "The central limit theorem states that, under appropriate conditions, the distribution of a normalized version of the sample mean converges to a standard normal distribution",
    name: (parameters) => `N(μ=${parameters[0]}, σ^2=${parameters[1]})`,
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
    this.min = Ratio.fromNumber(min);
    this.minFloat = min;
    this.max = Ratio.fromNumber(max);
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
    name: (parameters) => `U[a=${parameters[0]}, b=${parameters[1]}]`,
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
    this.rate = Ratio.fromNumber(rate);
    this.rateFloat = rate;
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * @param {Ratio} x
   * @returns {Ratio} P(X = x) = λ exp(-λx)
   */
  probability(x) {
    return this.rate.times(x).negative().powOf(Math.E).times(this.rate);
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution, this.cdfDistribution] = this.distributionSetQuantile();
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
    name: (parameters) => `Exp(λ=${parameters[0]})`,
    rCode: (parameters) => ({
      pdf: `dexp(x, ${parameters[0]})`,
      cdf: `pexp(x, ${parameters[0]})`,
      cdfReverse: `pexp(x, ${parameters[0]}, lower.tail=FALSE)`,
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

class Gamma extends ContinuousDistribution {
  /**
   * @param {float} shape α
   * @param {float} rate λ
   * @requires shape > 0
   * @requires rate > 0
   */
  constructor(shape, rate) {
    super();
    this.shape = Ratio.fromNumber(shape);
    this.rate = Ratio.fromNumber(rate);
    this.shapeMinusOne = this.shape.subtractOne(); // α - 1
    const lambdaAlpha = Ratio.fromNumber(rate ** shape); // λ ^ α
    this.gammaAlpha = gamma(this.shape); // Γ(α)
    this.correctionFactor = lambdaAlpha.divideBy(this.gammaAlpha); // λ^α/Γ(α)
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * @param {Ratio} x
   * @returns {Ratio} P(X = x) = λ^α/Γ(α) * x^(α-1) * exp(-λx)
   */
  probability(x) {
    return x
      .pow(this.shapeMinusOne)
      .times(x.negative().times(this.rate).powOf(Math.E))
      .times(this.correctionFactor);
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * CDF
   * @param {Ratio} x
   * @returns {Ratio} P(X <= x) = γ(α,λx)/Γ(α)
   */
  cumulative(x) {
    return lowerIncompleteGamma(this.shape, x.times(this.rate)).divideBy(this.gammaAlpha);
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution] = this.distributionSetQuantile(
      Ratio.fromNumber(0.1),
      0.99,
      this.cumulative(Ratio.fromNumber(0.1)),
      false
    );
    this.updateCdf();
  }

  static settings = {
    distribution: Gamma,
    title: "Gamma",
    interpretation:
      "Generalisation of exponential distribution, Erlang distribution, chi-squared distribution",
    name: (parameters) => `Gam(α=${parameters[0]}, λ=${parameters[1]})`,
    rCode: (parameters) => ({
      pdf: `dgamma(x, ${parameters[0]}, ${parameters[1]})`,
      cdf: `pgamma(x, ${parameters[0]}, ${parameters[1]})`,
      cdfReverse: `pgamma(x, ${parameters[0]}, ${parameters[1]}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) =>
        `qgamma(${cumulativeProbability}, ${parameters[0]}, ${parameters[1]})`,
      observations: (observationCount) =>
        `rgamma(${observationCount}, ${parameters[0]}, ${parameters[1]})`,
    }),
    parameters: [
      {
        name: "shape",
        description: `Shape, α`,
        domain: `α > 0`,
        validation: positiveRealNeqZero,
        symbol: "α",
        defaultValue: 2,
      },
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

class ChiSquared extends ContinuousDistribution {
  /**
   * @param {float} degreesOfFreedom k
   * @requires degreesOfFreedom > 0
   */
  constructor(degreesOfFreedom) {
    super();
    this.degreesOfFreedom = Ratio.fromNumber(degreesOfFreedom);
    this.dfHalf = this.degreesOfFreedom.divideBy(Ratio.fromInt(2));
    this.dfHalfMinusOne = this.dfHalf.subtractOne();
    this.gammaDFHalf = gamma(this.dfHalf); // Γ(k/2)
    this.correctionFactor = this.dfHalf.powOf(2).times(this.gammaDFHalf).invert();
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * @param {Ratio} x
   * @returns {Ratio} P(X = x) = 1/2^(k/2)Γ(k/2) * x^(k/2-1) * exp(-x/2)
   */
  probability(x) {
    return x
      .pow(this.dfHalfMinusOne)
      .times(x.divideBy(Ratio.fromInt(-2)).powOf(Math.E))
      .times(this.correctionFactor);
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * CDF
   * @param {Ratio} x
   * @returns {Ratio} P(X <= x) = γ(k/2,x/2)/Γ(k/2)
   */
  cumulative(x) {
    return lowerIncompleteGamma(this.dfHalf, x.divideBy(Ratio.fromInt(2))).divideBy(
      this.gammaDFHalf
    );
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution] = this.distributionSetQuantile(
      Ratio.fromNumber(0.1),
      0.99,
      this.cumulative(Ratio.fromNumber(0.1)),
      false
    );
    this.updateCdf();
  }

  static settings = {
    distribution: ChiSquared,
    title: "Chi-Squared",
    interpretation: "Sum of the squares of k independent standard normal random variables",
    name: (parameters) => `χ2_k=${parameters[0]}`,
    rCode: (parameters) => ({
      pdf: `dchisq(x, ${parameters[0]})`,
      cdf: `pchisq(x, ${parameters[0]})`,
      cdfReverse: `pchisq(x, ${parameters[0]}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) => `qchisq(${cumulativeProbability}, ${parameters[0]})`,
      observations: (observationCount) => `rchisq(${observationCount}, ${parameters[0]})`,
    }),
    parameters: [
      {
        name: "df",
        description: `Degrees of freedom, k`,
        domain: `k > 0`,
        validation: positiveRealNeqZero,
        symbol: "k",
        defaultValue: 1,
      },
    ],
  };
}

class Beta extends ContinuousDistribution {
  /**
   * @param {float} shape1 a
   * @param {float} shape2 b
   * @requires shape1 > 0
   * @requires shape2 > 0
   */
  constructor(shape1, shape2) {
    super();
    this.shape1 = Ratio.fromNumber(shape1);
    this.shape2 = Ratio.fromNumber(shape2);
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * @param {Ratio} x
   * @returns {Ratio} x^(a-1)(1-x)^(b-1) / (B(a,b))
   */
  probability(x) {
    return x
      .pow(this.shape1.subtractOne())
      .times(Ratio.ONE.subtract(x).pow(this.shape2.subtractOne()))
      .divideBy(beta(this.shape1, this.shape2));
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * CDF
   * @param {Ratio} x
   * @returns {Ratio} P(X <= x) = Ix(a, b)
   */
  cumulative(x) {
    return regularisedIncompleteBeta(x, this.shape1, this.shape2);
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution] = this.distributionSetRange(
      Ratio.ONE,
      Ratio.ZERO,
      Ratio.ZERO,
      false,
      this.shape1.gte(Ratio.ONE) && this.shape2.gte(Ratio.ONE)
    );
    this.updateCdf();
  }

  static settings = {
    distribution: Beta,
    title: "Beta",
    interpretation:
      "Prior distribution for a probability parameter p in binomial trials. If you’ve observed a-1 successes and b-1 failures, your posterior belief about p is Beta(a,b)",
    name: (parameters) => `β(shape1=${parameters[0]}, shape2=${parameters[0]})`,
    rCode: (parameters) => ({
      pdf: `dbeta(x, ${parameters[0]}, ${parameters[1]})`,
      cdf: `pbeta(x, ${parameters[0]}, ${parameters[1]})`,
      cdfReverse: `pbeta(x, ${parameters[0]}, ${parameters[1]}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) =>
        `qbeta(${cumulativeProbability}, ${parameters[0]}, ${parameters[1]})`,
      observations: (observationCount) =>
        `rbeta(${observationCount}, ${parameters[0]}, ${parameters[1]})`,
    }),
    parameters: [
      {
        name: "shape1",
        description: `Shape 1`,
        domain: `a > 0`,
        validation: positiveRealNeqZero,
        symbol: "a",
        defaultValue: 0.5,
      },
      {
        name: "shape2",
        description: `Shape 2`,
        domain: `b > 0`,
        validation: positiveRealNeqZero,
        symbol: "b",
        defaultValue: 0.5,
      },
    ],
  };
}

class FDistribution extends ContinuousDistribution {
  /**
   * @param {float} df1
   * @param {float} df2
   * @requires degreesOfFreedom1 > 0
   * @requires degreesOfFreedom2 > 0
   */
  constructor(df1, df2) {
    super();
    this.df1 = Ratio.fromNumber(df1);
    this.df1Half = this.df1.divideBy(Ratio.fromInt(2));
    this.df2 = Ratio.fromNumber(df2);
    this.df2Half = this.df2.divideBy(Ratio.fromInt(2));
    this.df2Squared = this.df2.pow(this.df2);
    this.df1df2 = this.df1.add(this.df2);
    this.beta = beta(this.df1Half, this.df2Half);
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * @param {Ratio} x
   * @returns {Ratio} P(X = x)
   */
  probability(x) {
    return this.df1
      .times(x)
      .pow(this.df1)
      .times(this.df2Squared)
      .divideBy(this.df1.times(x).add(this.df2).pow(this.df1df2))
      .powFloat(0.5)
      .divideBy(x)
      .divideBy(this.beta);
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * CDF
   * @param {Ratio} x
   * @returns {Ratio} P(X <= x)
   */
  cumulative(x) {
    return regularisedIncompleteBeta(
      this.df1.times(x).divideBy(this.df1.times(x).add(this.df2)),
      this.df1Half,
      this.df2Half
    );
  }

  /**
   * @param {float} cumulativeProbability
   * @requires 0 <= cumulativeProbability <= 1
   * @returns {float} Quantile of distribution at cumulativeProbability
   */
  quantile(cumulativeProbability) {
    const x = regularisedIncompleteBetaInverse(
      Ratio.fromNumber(cumulativeProbability),
      this.df1Half,
      this.df2Half
    );
    return this.df2
      .times(x)
      .divideBy(this.df1.times(Ratio.ONE.subtract(x)))
      .toValue();
  }

  /**
   * TODO: Quantile function can take a while, should implement an explicit quantile function if possible.
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution] = this.distributionSetQuantile(
      Ratio.fromNumber(0.1),
      0.99,
      this.cumulative(Ratio.fromNumber(0.1)),
      false,
      Ratio.fromInt(50)
    );
    this.updateCdf();
  }

  static settings = {
    distribution: FDistribution,
    title: "F",
    interpretation:
      "Arises frequently as the null distribution of a test statistic, most notably in the analysis of variance (ANOVA) and other F-tests",
    name: (parameters) => `F_df=${parameters[0]},df2=${parameters[0]}`,
    rCode: (parameters) => ({
      pdf: `df(x, ${parameters[0]}, ${parameters[1]})`,
      cdf: `pf(x, ${parameters[0]}, ${parameters[1]})`,
      cdfReverse: `pf(x, ${parameters[0]}, ${parameters[1]}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) =>
        `qf(${cumulativeProbability}, ${parameters[0]}, ${parameters[1]})`,
      observations: (observationCount) =>
        `rf(${observationCount}, ${parameters[0]}, ${parameters[1]})`,
    }),
    parameters: [
      {
        name: "df1",
        description: `Degrees of freedom 1`,
        domain: `df1 > 0`,
        validation: positiveRealNeqZero,
        symbol: "df1",
        defaultValue: 2,
      },
      {
        name: "df2",
        description: `Degrees of freedom 2`,
        domain: `df2 > 0`,
        validation: positiveRealNeqZero,
        symbol: "df2",
        defaultValue: 5,
      },
    ],
  };
}

class TDistribution extends ContinuousDistribution {
  /**
   * @param {float} df
   */
  constructor(df) {
    super();
    this.df = Ratio.fromNumber(df);
    this.dfHalf = Ratio.fromNumber(df).divideBy(Ratio.fromInt(2));
    this.half = Ratio.fromNumber(0.5);
    this.exponent = this.df.addOne().times(this.half).negative();
    this.correctionFactor = gamma(this.df.addOne().times(this.half))
      .divideBy(Ratio.PI.times(this.df).powFloat(0.5))
      .divideBy(gamma(this.dfHalf));
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * @param {Ratio} x
   * @returns {Ratio} P(X = x)
   */
  probability(x) {
    return x.times(x).divideBy(this.df).addOne().pow(this.exponent).times(this.correctionFactor);
  }

  /**
   * // TODO: Decide if to use float or Ratio for x
   * CDF
   * @param {Ratio} x
   * @returns {Ratio} P(X <= x)
   */
  cumulative(x) {
    const F = regularisedIncompleteBeta(
      x.times(x).add(this.df).divide(this.df),
      this.dfHalf,
      this.half
    ).times(this.half);
    return x.lt(Ratio.ZERO) ? F : Ratio.ONE.subtract(F);
  }

  /**
   * Sets pdf <array[Ratio]> and cdf <array[Ratio]>
   */
  setDistribution() {
    [this.pdfDistribution, this.cdfDistribution] = this.distributionSetRangeSymmetric(
      Ratio.fromNumber(this.quantile(0.99)),
      Ratio.ZERO,
      false
    );
    this.updateCdf();
  }

  /**
   * @param {float} cumulativeProbability
   * @requires 0 <= cumulativeProbability <= 1
   * @returns {float} Quantile of distribution at cumulativeProbability
   */
  quantile(cumulativeProbability) {
    if (cumulativeProbability < 0.5) {
      return -this.quantile(1 - cumulativeProbability);
    }

    const p = Ratio.fromNumber(cumulativeProbability);
    const x = regularisedIncompleteBetaInverse(
      Ratio.ONE.subtract(p).times(Ratio.fromInt(2)),
      this.dfHalf,
      this.half
    );
    return this.df.divideBy(x).subtract(this.df).powFloat(0.5).toValue();
  }

  static settings = {
    distribution: TDistribution,
    title: "T",
    interpretation:
      "Estimate of the mean of a normally distributed population in situations where: the sample size is small and the population standard deviation is unknown.",
    name: (parameters) => `t_m=${parameters[0]}`,
    rCode: (parameters) => ({
      pdf: `dt(x, ${parameters[0]})`,
      cdf: `pt(x, ${parameters[0]})`,
      cdfReverse: `pt(x, ${parameters[0]}, lower.tail=FALSE)`,
      quantile: (cumulativeProbability) => `qt(${cumulativeProbability}, ${parameters[0]})`,
      observations: (observationCount) => `rt(${observationCount}, ${parameters[0]})`,
    }),
    parameters: [
      {
        name: "df",
        description: `Degrees of freedom, m`,
        domain: `m > 0`,
        validation: positiveRealNeqZero,
        symbol: "m",
        defaultValue: 10,
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
  gamma: Gamma.settings,
  chiSquared: ChiSquared.settings,
  beta: Beta.settings,
  f: FDistribution.settings,
  t: TDistribution.settings,
};
