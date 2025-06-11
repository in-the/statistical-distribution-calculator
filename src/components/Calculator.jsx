import { useEffect, useState } from "react";
import DistributionTable from "./DistributionTable";
import DiscreteGraph from "./DiscreteGraph";
import { positiveInteger, summaryLegend } from "math/distribution";

export const PRECISION = 5;

function ParameterInput({ settings, calculate, getQuantile, getObservations }) {
  const [parameters, setParameters] = useState([]);
  const [cumulativeProbability, setCumulativeProbability] = useState(0.5);
  const [quantile, setQuantile] = useState();
  const [quantileCode, setQuantileCode] = useState();
  const [observationCount, setObservationCount] = useState(10);
  const [observationCode, setObservationCode] = useState();
  const [observations, setObservations] = useState([]);

  useEffect(() => setParameters(settings.parameters.map((p) => p.defaultValue)), [settings]);

  return (
    <div className="input-container">
      <table className="input-table">
        <tbody>
          {settings.parameters.map((p, index) => (
            <tr key={index}>
              <td>
                <label htmlFor={p.name}>{p.description}</label>
              </td>
              <td>
                <input
                  name={p.name}
                  id={p.name}
                  value={parameters[index]}
                  autoComplete="off"
                  onChange={(e) =>
                    setParameters([
                      ...parameters.slice(0, index),
                      e.target.value,
                      ...parameters.slice(index + 1),
                    ])
                  }
                />
              </td>
              <td>{p.domain}</td>
              {index === settings.parameters.length - 1 && (
                <td>
                  <input
                    type="button"
                    value="Calculate"
                    name="calculateButton"
                    onClick={() => calculate(parameters)}
                  />
                </td>
              )}
            </tr>
          ))}

          <tr className="separate">
            <td>
              Cumulative probability, F(<var>X</var>)
            </td>
            <td>
              <input
                name="FX"
                id="FX"
                value={cumulativeProbability}
                autoComplete="off"
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
                  calculate(parameters, (newDistribution) => {
                    const quantile = getQuantile(
                      newDistribution,
                      Number(Number(cumulativeProbability))
                    );
                    if (quantile === false) {
                      return;
                    }
                    setQuantile(quantile);
                    setQuantileCode(
                      settings.rCode(parameters).quantile(Number(cumulativeProbability))
                    );
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
            <td>
              Number of observations, <var>k</var>
            </td>
            <td>
              <input
                name="k"
                id="k"
                value={observationCount}
                autoComplete="off"
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
                  calculate(parameters, (newDistribution) => {
                    const observations = getObservations(newDistribution, Number(observationCount));
                    if (observations === false) {
                      return;
                    }
                    setObservations(observations);
                    setObservationCode(settings.rCode(parameters).observations(observationCount));
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
        <div>{observations.join(", ")}</div>
      </div>
    </div>
  );
}

export default function DiscreteDistributionCalculator({ settings }) {
  const [parameters, setParameters] = useState([]);
  const [distribution, setDistribution] = useState();
  const [pdf, setPdf] = useState([]);
  const [cdf, setCdf] = useState([]);

  useEffect(() => {
    setParameters(settings.parameters.map((parameter) => parameter.defaultValue));
    setDistribution(
      new settings.distribution(...settings.parameters.map((parameter) => parameter.defaultValue))
    );
    setPdf(settings.defaultPdf);
    setCdf(settings.defaultCdf);
  }, [settings]);

  /**
   * @param {int} newSize Checks newSize is an integer > 0
   * @param {float} newProb Checks 0 <= newProb <= 1
   */
  function calculate(newParameters, after = () => {}) {
    if (parameters.every((parameter, i) => parameter === newParameters[i])) {
      after(distribution);
      return;
    }
    for (let i = 0; i < newParameters.length; i++) {
      if (!settings.parameters[i].validation(newParameters[i], settings.parameters[i].symbol)) {
        return;
      }
    }

    newParameters = newParameters.map((parameter) => Number(parameter));
    setParameters(newParameters);

    // const [pdf, cdf] = Binomial.distribution(newSize, newProb);

    const newDistribution = new settings.distribution(...newParameters);
    setDistribution(newDistribution);

    // I'd like to call these after setDistribution finishes updating, instead of having to pass newDistribution manually
    // But I can't figure out how to do this.
    setPdf(newDistribution.pdf().map((x) => x.toFixed(PRECISION)));
    setCdf(newDistribution.cdf().map((x) => x.toFixed(PRECISION)));
    // console.log(newDistribution.pdf().map((x) => x.toFixed(PRECISION)));
    // console.log(newDistribution.cdf().map((x) => x.toFixed(PRECISION)));
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
    if (!positiveInteger(count, "k")) {
      return false;
    }
    return distribution.observe(count);
  }

  return (
    <div>
      {/* {console.log(Ratio.E.pow(Ratio.fromNumber(1.1)))} */}
      <ParameterInput {...{ settings, calculate, getQuantile, getObservations }} />

      <div className="output-container">
        <DistributionTable
          {...{
            pdf,
            cdf,
            name: settings.name(parameters),
            precision: PRECISION,
            rCode: settings.rCode(parameters),
          }}
        />
        <div className="graph-container">
          <DiscreteGraph distribution={pdf} title={`${settings.title} PDF`} label="P(X = x)" />
          <DiscreteGraph distribution={cdf} title={`${settings.title} CDF`} label="P(X ≤ x)" />
        </div>
      </div>

      <div className="infobox">
        <h2>{settings.title} Distribution</h2>
        Interpretation: {settings.interpretation}.
        <ul>
          {distribution &&
            Object.entries(summaryLegend).map(([property, legend], index) => (
              property in distribution.summary() &&
              <li key={index}>
                {legend} {distribution.summary()[property].formula} ={" "}
                {distribution.summary()[property].value}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
