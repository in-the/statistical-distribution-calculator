import { combination } from "./math";
import Ratio from "math/ratio";

/**
 * @param {function(int x => Ratio)} probabilityFunction P(X = x)
 * @param {int} max 
 * @param {int} min 
 * @returns 
 */
function distribution(probabilityFunction, max, min=0) {
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
   * @param {int} x
   * @param {int} size
   * @param {Ratio} prob
   * @requires 0 <= x <= size
   * @requires 0 <= prob <= 1
   * @returns {Ratio}
   */
  static probabiblity(x, size, prob) {
    const nCx = new Ratio(combination(size, x));
    const px = prob.pow(Ratio.fromInt(x));
    const complement = Ratio.ONE.subtract(prob).pow(new Ratio(size - x));
    return nCx.times(px).times(complement);
  }

  /**
   * @param {int} size
   * @param {float} prob
   * @requires 0 <= x <= size
   * @requires 0 <= prob <= 1
   * @returns [list[Ratio], list[Ratio]] pdf, cdf
   */
  static distribution(size, prob) {
    const probRatio = Ratio.fromNumber(prob);
    return distribution((x) => Binomial.probabiblity(x, size, probRatio), size);
  }
}
