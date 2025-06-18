import { Bar, Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import Annotation from "chartjs-plugin-annotation";
const legendMargin = {
  id: "legendMargin",
  beforeInit(chart, legend, options) {
    let fitValue = chart.legend.fit;
    chart.legend.fit = function fit() {
      fitValue.bind(chart.legend)();
      return (this.height += options.paddingTop);
    };
  },
  defaults: {
    paddingTop: 0, // <-- default padding
  },
};
Chart.register(Annotation);

function DiscreteGraph({ distribution, observations, quantile, title, label, precision }) {
  const [observationsCount, observationsProportion] = observations;

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: title,
      },
      datalabels: {
        backgroundColor: function (context) {
          return context.dataset.backgroundColor;
        },
        borderRadius: 4,
        color: "white",
        font: {
          weight: "bold",
        },
        padding: 6,
      },
      legendMargin: { paddingTop: 25 },
      annotation: {
        annotations: quantile.length && [
          {
            type: "line",
            mode: "horizontal",
            scaleID: "y",
            value: quantile[0],
            borderColor: "rgb(153, 102, 255)",
            borderWidth: 1,
          },
          {
            type: "line",
            mode: "vertical",
            scaleID: "x",
            value: quantile[1],
            borderColor: "rgb(153, 102, 255)",
            borderWidth: 1,
          },
        ],
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

  const datasets = [
    {
      label: label,
      data: distribution.map((x) => x.toFixed(precision)),
      borderColor: "rgb(255, 99, 132)",
      backgroundColor: "rgba(255, 99, 132, 0.5)",
      datalabels: {
        display: false,
      },
    },
  ];

  if (observations.length) {
    datasets.push({
      label: "Observations",
      data: observationsProportion,
      borderColor: "rgb(53, 162, 235)",
      backgroundColor: "rgba(53, 162, 235, 0.5)",
      datalabels: {
        formatter: (context, chart_obj) => observationsCount[chart_obj.dataIndex],
        anchor: "end",
        align: "top",
      },
    });
  }

  const data = {
    labels: Array.from(distribution.keys()),
    datasets: datasets,
  };

  return <Bar {...{ options, data, plugins: [ChartDataLabels, legendMargin, Annotation] }} />;
}

function ContinuousGraph({ distribution, observations, quantile, title, label, precision }) {
  const annotations = observations.map(function (value, index) {
    return {
      type: "line",
      mode: "vertical",
      scaleID: "x",
      value: value,
      borderColor: "rgb(53, 162, 235)",
      borderWidth: 1,
    };
  });
  if (quantile.length) {
    annotations.push(
      {
        type: "line",
        mode: "horizontal",
        scaleID: "y",
        value: quantile[0],
        borderColor: "rgb(153, 102, 255)",
        borderWidth: 1,
      },
      {
        type: "line",
        mode: "vertical",
        scaleID: "x",
        value: quantile[1],
        borderColor: "rgb(153, 102, 255)",
        borderWidth: 1,
      }
    );
  }
  let min = distribution[0][0];
  if (min > 0 && min < 0.2) min = 0
  let max = distribution[distribution.length - 1][0];
  if (max > .8 && max < 1) max = 1;
  const options = {
    responsive: true,
    scales: {
      x: {
        type: "linear",
        min: min,
        max: max,
      },
      y: {
        type: "linear",
        min: 0, // Set your desired minimum value
      },
    },
    plugins: {
      title: {
        display: true,
        text: title,
      },
      annotation: {
        annotations: annotations,
      },
    },
    maintainAspectRatio: false,
  };

  const datasets = [
    {
      label: label,
      data: distribution.map(([x, prob]) => prob.toFixed(precision)),
      fill: true,
      borderColor: "rgb(255, 99, 132)",
      backgroundColor: "rgba(255, 99, 132, 0.5)",
    },
  ];

  const data = {
    labels: distribution.map(([x, prob]) => x),
    datasets: datasets,
  };
  return (
    <Line
      {...{
        options,
        data,
      }}
    />
  );
}

export default function DistributionGraph({
  distribution,
  observations,
  quantile = [],
  title,
  label,
  precision,
  type,
}) {
  if (type === "discrete") {
    return <DiscreteGraph {...{ distribution, observations, quantile, title, label, precision }} />;
  } else if (type === "continuous") {
    return (
      <ContinuousGraph {...{ distribution, observations, quantile, title, label, precision }} />
    );
  }
}
