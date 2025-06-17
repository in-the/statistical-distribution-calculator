import { useEffect, useState } from "react";
import DistributionTable, { copyText } from "./DistributionTable";
import DistributionGraph from "./DistributionGraph";
import { positiveInteger, positiveIntegerMin, summaryLegend } from "math/distribution";

const OBSERVATION_PRECISION = 2;

function ParameterInput({
  settings,
  calculate,
  getQuantile,
  getObservations,
  distribution,
  setDatapoints,
  numDatapoints,
  setNumDatapoints,
  reset,
}) {
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
                  <button name="calculateButton" onClick={() => calculate(parameters)}>
                    Calculate
                  </button>
                </td>
              )}
            </tr>
          ))}

          {distribution && distribution.TYPE === "continuous" && (
            <tr className="separate">
              <td>
                <label htmlFor="datapoints">Number of datapoints</label>
              </td>
              <td>
                <input
                  name="datapoints"
                  id="datapoints"
                  value={numDatapoints}
                  autoComplete="off"
                  onChange={(e) => setNumDatapoints(e.target.value)}
                />
              </td>
              <td>An integer {">"} 0</td>
              <td>
                <button name="setDatapointsButton" onClick={() => setDatapoints(numDatapoints)}>
                  Set datapoints
                </button>
              </td>
            </tr>
          )}

          <tr className="separate">
            <td>
              <label htmlFor="FX">
                Cumulative probability, F(<var>X</var>)
              </label>
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
              <button
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
                    setQuantile(Number(quantile.toFixed(newDistribution.PRECISION)));
                    setQuantileCode(
                      settings.rCode(parameters).quantile(Number(cumulativeProbability))
                    );
                  });
                }}
              >
                Get quantile
              </button>
            </td>
            <td>
              <span className="r-code" onClick={(e) => copyText(e, quantileCode)}>
                {quantileCode}
              </span>
              {quantile ? " = " : ""}
            </td>
            <td>{quantile}</td>
          </tr>
          <tr>
            <td>
              <label htmlFor="k">
                Number of observations, <var>k</var>
              </label>
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
              <button
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
              >
                Generate observations
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="observations">
        <div className="legend">
          <span className="r-code" onClick={(e) => copyText(e, observationCode)}>
            {observationCode}
          </span>
          {observations.length ? " = " : ""}
        </div>
        <div>{observations.join(", ")}</div>
        {observations.length ? (
          <button name="resetButton" id="reset-button" onClick={reset}>
            Clear
          </button>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

export default function DistributionCalculator({ settings }) {
  const [parameters, setParameters] = useState([]);
  const [distribution, setDistribution] = useState(undefined);
  const [pdf, setPdf] = useState([]);
  const [cdf, setCdf] = useState([]);
  const [numDatapoints, setNumDatapoints] = useState();
  const [observations, setObservations] = useState([[], []]); // [[float] observationFrequency to overlay on pdf graph, [float] observationCumulative to overlay on cdf graph]
  const [quantile, setQuantile] = useState([]); // [float p cumulative probability, float corresponding x such that P(X<=x) = p]

  useEffect(() => {
    setParameters(settings.parameters.map((parameter) => parameter.defaultValue));
    const newDistribution = new settings.distribution(
      ...settings.parameters.map((parameter) => parameter.defaultValue)
    );
    setDistribution(newDistribution);
    if (newDistribution.TYPE === "continuous") {
      if (typeof numDatapoints === "undefined") {
        setNumDatapoints(newDistribution.DATAPOINTS);
      } else {
        newDistribution.DATAPOINTS = numDatapoints;
      }
    }
    setPdf(newDistribution.pdf());
    setCdf(newDistribution.cdf());
    setObservations([[], []]);
    setQuantile([]);
  }, [settings]);

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
    if (newDistribution.TYPE === "continuous") {
      setNumDatapoints(newDistribution.DATAPOINTS);
    }

    // I'd like to call these after setDistribution finishes updating, instead of having to pass newDistribution manually
    // But I can't figure out how to do this.
    setPdf(newDistribution.pdf());
    setCdf(newDistribution.cdf());
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

    const quantile = distribution.quantile(cumulativeProbability);
    setQuantile([cumulativeProbability, quantile]);
    return quantile;
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
    const observations = distribution.observe(count);
    if (distribution.TYPE === "continuous") {
      observations.map((x) => x.toFixed(OBSERVATION_PRECISION));
      setObservations([distribution.observations, distribution.observations]);
    } else {
      setObservations([distribution.observationFrequency(), distribution.observationCumulative()]);
    }
    return observations;
  }

  function setDatapoints(n) {
    if (!positiveIntegerMin(n, "Number of datapoints", 2)) {
      return;
    }
    distribution.DATAPOINTS = Number(n);
    distribution.setDistribution();
    setPdf(distribution.pdf());
    setCdf(distribution.cdf());
  }

  function reset() {
    setObservations([[], []]);
    setQuantile([]);
  }

  return (
    <div>
      <ParameterInput
        {...{
          settings,
          calculate,
          getQuantile,
          getObservations,
          distribution,
          setDatapoints,
          numDatapoints,
          setNumDatapoints,
          reset,
        }}
      />

      <div className="output-container">
        <DistributionTable
          {...{
            pdf,
            cdf,
            name: settings.name(parameters),
            precision: distribution && distribution.PRECISION,
            rCode: settings.rCode(parameters),
            type: distribution ? distribution.TYPE : "",
          }}
        />
        <div className="graph-container">
          <DistributionGraph
            distribution={pdf}
            observations={observations[0]}
            title={`${settings.title} PDF`}
            label="P(X = x)"
            precision={distribution && distribution.PRECISION}
            type={distribution ? distribution.TYPE : ""}
          />
          <DistributionGraph
            distribution={cdf}
            observations={observations[1]}
            quantile={quantile}
            title={`${settings.title} CDF`}
            label="P(X ≤ x)"
            precision={distribution && distribution.PRECISION}
            type={distribution ? distribution.TYPE : ""}
          />
        </div>
      </div>

      <div className="infobox">
        <h2>{settings.title} Distribution</h2>
        Interpretation: {settings.interpretation}.
        <ul>
          {distribution &&
            Object.entries(summaryLegend).map(
              ([property, legend], index) =>
                property in distribution.summary() && (
                  <li key={index}>
                    {legend} {distribution.summary()[property].formula} ={" "}
                    {distribution.summary()[property].value}
                  </li>
                )
            )}
        </ul>
      </div>
    </div>
  );
}
