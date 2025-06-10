import { combination } from "./math";
import Ratio from "math/ratio";

/**
 * @param {function(int x => Ratio)} probabilityFunction P(X = x)
 * @param {int} max
 * @param {int} min
 * @returns
 */
function distribution(probabilityFunction, max, min = 0) {
  const pdf = [];
  const cdf = [];
  let cumulative = Ratio.ZERO;
  for (let x = 0; x <= max; x++) {
    const p = probabilityFunction(x);
    pdf.push(p);
    cumulative = cumulative.add(p);
    cdf.push(cumulative);
  }
  return [pdf, cdf];
}

export class Binomial {
  /**
   * @param {int} size
   * @param {float} prob
   * @requires 0 <= x <= size
   * @requires 0 <= prob <= 1
   */
  constructor(size, prob) {
    this.size = size;
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
    [this.pdfDistribution, this.cdfDistribution] = distribution(
      (x) => this.probability(x),
      this.size
    );
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
      while (q <= this.size) {
        if (this.cdfDistribution[q].gt(cumulative)) {
          break;
        }
        q++;
      }
      return q;
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
}
