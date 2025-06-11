import Ratio from "math/ratio";
import { useState } from "react";

export function copyText(e, text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      e.target.innerText = text + " Copied!";
    })
    .finally(() => {
      setTimeout(() => {
        e.target.innerText = text;
      }, 1000);
    });
}

export default function DistributionTable({ pdf, cdf, name, precision, rCode }) {
  const [exactDisplay, setExactDisplay] = useState(false);

  function displayRatio(ratio) {
    return exactDisplay ? ratio.toString() : ratio.toFixed(precision);
  }

  return (
    <table className="distribution-table">
      <thead>
        <tr>
          <th colSpan="4">
            {name}{" "}
            <input
              type="checkbox"
              id="exact-toggle"
              name="exact-toggle"
              checked={exactDisplay}
              onChange={() => setExactDisplay(!exactDisplay)}
            />
            <label htmlFor="exact-toggle" id="exact-toggle-label">
              Exact
            </label>
          </th>
        </tr>
        <tr>
          <th />
          <th>
            f(<var>x</var>)
          </th>
          <th>
            F(<var>x</var>)
          </th>
          <th>
            1 - F(<var>x</var>)
          </th>
        </tr>
        <tr>
          <th>
            <var>x</var>
          </th>
          <th>
            Pr(<var>X</var> = <var>x</var>)
          </th>
          <th>
            Pr(<var>X</var> ≤ <var>x</var>)
          </th>
          <th>
            Pr(<var>X</var> {">"} <var>x</var>)
          </th>
        </tr>
        <tr>
          <th>R</th>
          <th className="r-code" onClick={(e) => copyText(e, rCode.pdf)}>
            {rCode.pdf}
          </th>
          <th className="r-code" onClick={(e) => copyText(e, rCode.cdf)}>
            {rCode.cdf}
          </th>
          <th className="r-code" onClick={(e) => copyText(e, rCode.cdfReverse)}>
            {rCode.cdfReverse}
          </th>
        </tr>
      </thead>
      <tbody>
        {cdf.map((cum, index) => (
          <tr key={index}>
            <td>{index}</td>
            <td>{displayRatio(pdf[index])}</td>
            <td>{displayRatio(cum)}</td>
            <td>{displayRatio(Ratio.ONE.subtract(cum))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
