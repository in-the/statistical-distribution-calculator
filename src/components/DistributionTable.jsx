export default function DistributionTable({ pdf, cdf, name, precision, rCode }) {
  return (
    <table className="distribution-table">
      <thead>
        <tr>
          <th colSpan="4">{name}</th>
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
          <th>{rCode.pdf}</th>
          <th>{rCode.cdf}</th>
          <th>{rCode.cdfReverse}</th>
        </tr>
      </thead>
      <tbody>
        {cdf.map((cum, index) => (
          <tr key={index}>
            <td>{index}</td>
            <td>{pdf[index]}</td>
            <td>{cum}</td>
            <td>{(1 - cum).toFixed(precision)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
