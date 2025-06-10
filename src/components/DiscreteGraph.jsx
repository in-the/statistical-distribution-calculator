import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

export default function DiscreteGraph({ distribution, title }) {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
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
        label: "Dataset",
        data: distribution,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };
  console.log(data);

  return <Line {...{ options, data }} />;
}
