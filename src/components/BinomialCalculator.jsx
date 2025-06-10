import { Binomial } from "math/distribution";
import { useEffect, useState } from "react";
import DistributionTable from "./DistributionTable";
import DiscreteGraph from "./DiscreteGraph";

const PRECISION = 5;

function BinomialInput({ size, setSize, prob, setProb, calculate }) {
  return (
    <table>
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
            (<var>n</var> a positive integer {">"} 0)
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
        </tr>
        <tr>
          <td />
          <td>
            <input type="button" value="calculate" name="calculateButton" onClick={calculate} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function BinomialCalculator() {
  const [size, setSize] = useState("11");
  const [prob, setProb] = useState("0.6");
  const [name, setName] = useState("Binomial distribution (n=11, p=0.6)");
  const [pdf, setPdf] = useState([
    "0.00004",
    "0.00069",
    "0.00519",
    "0.02335",
    "0.07007",
    "0.14714",
    "0.22072",
    "0.23648",
    "0.17736",
    "0.08868",
    "0.02660",
    "0.00362",
  ]);
  const [cdf, setCdf] = useState([
    "0.00004",
    "0.00073",
    "0.00592",
    "0.02928",
    "0.09935",
    "0.24650",
    "0.46722",
    "0.70371",
    "0.88108",
    "0.96976",
    "0.99637",
    "1.00000",
  ]);

  function calculate() {
    const n = Number(size);
    if (isNaN(n) || n === Infinity || n % 1 || n < 0) {
      console.log(isNaN(n) || n === Infinity);
      alert("n must be a positive integer");
      return;
    }
    const p = Number(prob);
    if (isNaN(p) || isNaN(parseFloat(p)) || p < 0 || p > 1) {
      alert("p must be in range (0,1)");
      return;
    }

    const distribution = Binomial.distribution(n, p);
    setPdf(distribution[0].map((x) => x.toFixed(PRECISION)));
    setCdf(distribution[1].map((x) => x.toFixed(PRECISION)));
    setName(`Binomial distribution (n=${Number(size)}, p=${Number(prob)})`);
  }

  return (
    <div>
      <BinomialInput {...{ size, setSize, prob, setProb, calculate }} />
      <div className="output-container">
        <DistributionTable {...{ pdf, cdf, name, precision: PRECISION }} />
        <div className="graph-container">
          <DiscreteGraph distribution={pdf} title={"Binomial PDF"} />
          <DiscreteGraph distribution={cdf} title={"Binomial CDF"} />
        </div>
      </div>
    </div>
  );
}
