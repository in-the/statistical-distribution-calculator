import { Bar, Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

export default function DistributionGraph({ distribution, title, label, precision, type }) {
  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: title,
      },
    },
    maintainAspectRatio: false,
    scales: {
      y: {
        type: "linear",
        min: 0, // Set your desired minimum value
      },
    },
  };

  const data = {
    labels:
      type === "discrete" ? Array.from(distribution.keys()) : distribution.map(([x, prob]) => x),
    datasets: [
      {
        label: label,
        data:
          type === "discrete"
            ? distribution.map((x) => x.toFixed(precision))
            : distribution.map(([x, prob]) => prob.toFixed(precision)),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  if (type === "discrete") {
    return <Bar {...{ options, data }} />;
  } else if (type === "continuous") {
    return <Line {...{ options, data }} />;
  }
}
