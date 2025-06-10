export default function DistributionTable({ pdf, cdf, name, precision }) {
  return (
    <table class="distribution-table">
      <thead>
        <tr>
          <th colspan="4">{name}</th>
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
