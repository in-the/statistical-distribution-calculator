import { Binomial } from "math/distribution";
import { useCallback, useEffect, useRef, useState } from "react";
import DistributionTable from "./DistributionTable";
import DiscreteGraph from "./DiscreteGraph";

const PRECISION = 5;

function BinomialInput({ calculate, getQuantile, getObservations }) {
  const [size, setSize] = useState("11");
  const [prob, setProb] = useState("0.6");
  const [cumulativeProbability, setCumulativeProbability] = useState();
  const [quantile, setQuantile] = useState();
  const [quantileCode, setQuantileCode] = useState();
  const [observationCount, setObservationCount] = useState(10);
  const [observationCode, setObservationCode] = useState();
  const [observations, setObservations] = useState([]);
  return (
    <div className="input-container">
      <table className="input-table">
        <tbody>
          <tr>
            <td>
              <label for="size">
                Number of trials, <var>n</var>:
              </label>
            </td>
            <td>
              <input name="size" id="size" value={size} onChange={(e) => setSize(e.target.value)} />
            </td>
            <td>
              (<var>n</var> an integer {">"} 0)
            </td>
          </tr>
          <tr>
            <td>
              <label for="prob">
                Probability of success, <var>p</var>:
              </label>
            </td>
            <td>
              <input name="prob" id="prob" value={prob} onChange={(e) => setProb(e.target.value)} />
            </td>
            <td>
              (0 {"<"} <var>p</var> {"<"} 1)
            </td>
            <td>
              <input
                type="button"
                value="Calculate"
                name="calculateButton"
                onClick={() => calculate(Number(size), Number(prob))}
              />
            </td>
          </tr>
          <tr className="separate">
            <td>
              Cumulative probability, F(<var>X</var>)
            </td>
            <td>
              <input
                name="FX"
                id="FX"
                value={cumulativeProbability}
                onChange={(e) => setCumulativeProbability(e.target.value)}
              />
            </td>
            <td>
              (0 ≤ F(<var>X</var>) ≤ 1)
            </td>
            <td>
              <input
                type="button"
                value="Get quantile"
                name="quantileButton"
                onClick={() => {
                  calculate(Number(size), Number(prob), (newDistribution) => {
                    const quantile = getQuantile(newDistribution, Number(cumulativeProbability));
                    if (quantile === false) {
                      return;
                    }
                    setQuantile(quantile);
                    setQuantileCode(`qbinom(${cumulativeProbability}, ${size}, ${prob})`);
                  });
                }}
              />
            </td>
            <td>
              {quantileCode}
              {typeof quantile === "number" ? " = " : ""}
            </td>
            <td>{quantile}</td>
          </tr>
          <tr>
            <td>Number of observations, k</td>
            <td>
              <input
                name="k"
                id="k"
                value={observationCount}
                onChange={(e) => setObservationCount(e.target.value)}
              />
            </td>
            <td>
              (<var>k</var> an integer {">"} 0)
            </td>
            <td>
              <input
                type="button"
                value="Generate observations"
                name="generateRandomButton"
                onClick={() => {
                  calculate(Number(size), Number(prob), (newDistribution) => {
                    const observations = getObservations(newDistribution, Number(observationCount));
                    if (observations === false) {
                      return;
                    }
                    setObservations(observations);
                    setObservationCode(`rbinom(${observationCount}, ${size}, ${prob})`);
                  });
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div className="observations">
        <div className="legend">
          {observationCode}
          {observations.length ? " = " : ""}
        </div>
        {observations.join(", ")}
      </div>
    </div>
  );
}

export default function BinomialCalculator() {
  const [size, setSize] = useState("11");
  const [prob, setProb] = useState("0.6");
  const [distribution, setDistribution] = useState(new Binomial(11, 0.6));
  const [pdf, setPdf] = useState([
    "0.00004",
    "0.00069",
    "0.00519",
    "0.02336",
    "0.07007",
    "0.14715",
    "0.22072",
    "0.23649",
    "0.17737",
    "0.08868",
    "0.02661",
    "0.00363",
  ]);
  const [cdf, setCdf] = useState([
    "0.00004",
    "0.00073",
    "0.00592",
    "0.02928",
    "0.09935",
    "0.24650",
    "0.46723",
    "0.70372",
    "0.88108",
    "0.96977",
    "0.99637",
    "1.00000",
  ]);

  /**
   * @param {int} newSize Checks newSize is an integer > 0
   * @param {float} newProb Checks 0 <= newProb <= 1
   */
  function calculate(newSize, newProb, after) {
    if (newSize === size && newProb === prob) {
      after(distribution);
      return;
    }
    if (isNaN(newSize) || newSize === Infinity || newSize % 1 || newSize < 0) {
      alert("n must be a positive integer");
      return;
    }
    if (isNaN(newProb) || isNaN(parseFloat(newProb)) || newProb < 0 || newProb > 1) {
      alert("p must be in range (0, 1)");
      return;
    }

    setSize(newSize);
    setProb(newProb);
    // const [pdf, cdf] = Binomial.distribution(newSize, newProb);

    const newDistribution = new Binomial(newSize, newProb);
    setDistribution(newDistribution);

    // I'd like to call these after setDistribution finishes updating, instead of having to pass newDistribution manually
    // But I can't figure out how to do this.
    setPdf(newDistribution.pdf().map((x) => x.toFixed(PRECISION)));
    setCdf(newDistribution.cdf().map((x) => x.toFixed(PRECISION)));
    after(newDistribution);
  }

  /**
   *
   * @param {Binomial} distribution
   * @param {float} cumulativeProbability
   * @returns {int} Quantile of distribution at cumulativeProbability
   */
  function getQuantile(distribution, cumulativeProbability) {
    if (
      isNaN(cumulativeProbability) ||
      isNaN(parseFloat(cumulativeProbability)) ||
      cumulativeProbability < 0 ||
      cumulativeProbability > 1
    ) {
      alert("F(X) must be in range (0, 1)");
      return false;
    }
    return distribution.quantile(cumulativeProbability);
  }

  /**
   * @param {Binomial} distribution 
   * @param {int} count 
   * @returns {array[int]} Array of <count> random observations from distribution
   */
  function getObservations(distribution, count) {
    if (isNaN(count) || count === Infinity || count % 1 || count < 0) {
      alert("k must be a positive integer");
      return false;
    }
    return distribution.observe(count);
  }

  return (
    <div>
      <BinomialInput {...{ calculate, getQuantile, getObservations }} />
      <div className="output-container">
        <DistributionTable
          {...{
            pdf,
            cdf,
            name: `Binomial distribution (n=${size}, p=${prob})`,
            precision: PRECISION,
            rCode: {
              pdf: `dbinom(x, ${size}, ${prob})`,
              cdf: `pbinom(x, ${size}, ${prob})`,
              cdfReverse: `pbinom(x, ${size}, ${prob}, lower.tail=FALSE)`,
            },
          }}
        />
        <div className="graph-container">
          <DiscreteGraph distribution={pdf} title="Binomial PDF" label="P(X = x)" />
          <DiscreteGraph distribution={cdf} title="Binomial CDF" label="P(X ≤ x)" />
        </div>
      </div>
    </div>
  );
}
