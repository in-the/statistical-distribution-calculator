import DiscreteDistributionCalculator from "components/Calculator";
import "css/App.css";
import { Binomial, Poisson } from "math/distribution";
import { useState } from "react";

export function positiveInteger(variable, symbol) {
  if (isNaN(variable) || variable === Infinity || variable % 1 || variable < 0) {
    alert(`${symbol} must be a positive integer`);
    return false;
  }
  return true;
}

function floatInRange(variable, min, max, symbol) {
  if (isNaN(variable) || isNaN(parseFloat(variable)) || variable < min || variable > max) {
    alert(`${symbol} must be in range [${min}, ${max}]`);
    return false;
  }
  return true;
}

function floatInRangeOpenInterval(variable, min, max, symbol) {
  if (isNaN(variable) || isNaN(parseFloat(variable)) || variable <= min || variable >= max) {
    alert(`${symbol} must be in range (${min}, ${max})`);
    return false;
  }
  return true;
}

const BinomialSettings = {
  distribution: Binomial,
  title: "Binomial",
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
      description: `Number of trials, n:`,
      domain: `n an integer > 0`,
      validation: positiveInteger,
      symbol: "n",
      defaultValue: 11,
    },
    {
      name: "prob",
      description: `Probability of success, p:`,
      domain: `0 < p < 1`,
      validation: (variable, symbol) => floatInRange(variable, 0, 1, symbol),
      symbol: "p",
      defaultValue: 0.6,
    },
  ],
  defaultPdf: [
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
  ],
  defaultCdf: [
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
  ],
};

const PoissonSettings = {
  distribution: Poisson,
  title: "Poisson",
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
      description: `Constant mean rate, λ:`,
      domain: `λ > 0`,
      validation: (variable, symbol) => floatInRangeOpenInterval(variable, 0, Infinity, symbol),
      symbol: "λ",
      defaultValue: 1,
    },
  ],
  defaultPdf: [
    "0.36788",
    "0.36788",
    "0.18394",
    "0.06131",
    "0.01533",
    "0.00307",
    "0.00051",
    "0.00007",
    "0.00001",
  ],
  defaultCdf: [
    "0.36788",
    "0.73576",
    "0.91970",
    "0.98101",
    "0.99634",
    "0.99941",
    "0.99992",
    "0.99999",
    "1.00000",
  ],
};

function DistributionSelect({ settings, setSettings }) {
  return (
    <div className="distribution-select">
      <label htmlFor="settings">Choose Distribution: </label>
      <select
        id="settings"
        name="settings"
        onChange={(e) => setSettings(e.target.value)}
        value={settings}
      >
        <option value="binomial">Binomial Distribution</option>
        <option value="poisson">Poisson Distribution</option>
      </select>
    </div>
  );
}

function App() {
  const [settings, setSettings] = useState("poisson");

  return (
    <div className="App">
      <h1>Statistical Distribution Calculator</h1>
      <DistributionSelect settings={settings} setSettings={setSettings} />
      <DiscreteDistributionCalculator
        settings={{ binomial: BinomialSettings, poisson: PoissonSettings }[settings]}
      />
    </div>
  );
}

export default App;
