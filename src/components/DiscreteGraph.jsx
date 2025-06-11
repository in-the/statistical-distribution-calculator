import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";

export default function DiscreteGraph({ distribution, title, label }) {
  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: title,
      },
    },
    maintainAspectRatio: false,
  };

  const data = {
    labels: Array.from(distribution.keys()),
    datasets: [
      {
        label: label,
        data: distribution,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  return <Bar {...{ options, data }} />;
}
