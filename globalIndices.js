// global indices
document.addEventListener("DOMContentLoaded", function () {
  // Global Indices Chart
  const globalChartContainer = document.querySelector("#chart");
  if (!globalChartContainer) {
    console.error(
      'Chart container not found. Ensure a div with id="chart" exists in the HTML.'
    );
    return;
  }

  const legendContainer = globalChartContainer.querySelector("#custom-legend");
  if (!legendContainer) {
    console.error(
      'Legend container not found. Ensure a div with id="custom-legend" exists inside the chart div.'
    );
    return;
  }
  legendContainer.innerHTML = "";

  const globalChartCanvas = document.createElement("canvas");
  globalChartCanvas.id = "global-indices-chart";
  globalChartContainer.insertBefore(globalChartCanvas, legendContainer);

  if (typeof Chart === "undefined") {
    console.error(
      "Chart.js library is not loaded. Please include the Chart.js script in your HTML."
    );
    return;
  }

  const apiUrl =
    "https://irr-worker.irr-calculation.workers.dev?type=global-indices";

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        console.error(
          "API response not ok. Status:",
          response.status,
          "StatusText:",
          response.statusText
        );
        throw new Error("API response not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (!data.data || !Array.isArray(data.data)) {
        console.error("Invalid API response data:", data);
        throw new Error("Invalid API response data");
      }

      console.log("API data received:", data);

      const dates = data.data
        .find((item) => item.table === "Base Adjusted Values")
        .historicalData.map((item) => {
          const date = new Date((item.date - 25569) * 86400 * 1000);
          return date.getFullYear().toString();
        });

      const indices = data.data
        .filter((item) => item.table === "Base Adjusted Values")
        .map((item) => ({
          name: item.indexName || "Unknown Series",
          data: item.historicalData.map((val) =>
            val.value === null ? null : parseFloat(val.value)
          ),
        }));

      const actualValuesMap = {};
      data.data
        .filter((item) => item.table === "Actual Values")
        .forEach((item) => {
          actualValuesMap[item.indexName] = item.historicalData.map((val) => ({
            date: val.date,
            value: val.value === null ? null : parseFloat(val.value),
          }));
        });

      if (indices.length !== Object.keys(actualValuesMap).length) {
        console.warn(
          "Mismatch in number of series:",
          indices.length,
          "indices vs",
          Object.keys(actualValuesMap).length,
          "actual values"
        );
      }
      indices.forEach((index, i) => {
        if (!actualValuesMap[index.name]) {
          console.warn(`No actual values for series: ${index.name}`);
        }
        if (index.data.length !== actualValuesMap[index.name]?.length) {
          console.warn(
            `Data points mismatch for series ${index.name}:`,
            index.data.length,
            "vs",
            actualValuesMap[index.name]?.length
          );
        }
      });

      const colorPalette = [
        "#A5B4FC", // Light Indigo
        "#FBCFE8", // Light Pink
        "#A7F3D0", // Light Mint
        "#F9E2AF", // Light Yellow
        "#BAE6FD", // Light Sky Blue
        "#FCA5A5", // Light Coral
        "#D9F99D", // Light Lime
        "#C4B5FD", // Light Violet
        "#99F6E4", // Light Teal
      ];

      const initialIndices = ["NASDAQ 100", "NIFTY IT", "BSE IT", "NIFTY"];

      const datasets = indices.map((indexData, i) => ({
        label: indexData.name,
        data: indexData.data,
        borderColor: colorPalette[i % colorPalette.length],
        backgroundColor: "transparent",
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHitRadius: 7,
        pointBackgroundColor: colorPalette[i % colorPalette.length],
        pointHoverBackgroundColor: colorPalette[i % colorPalette.length],
        pointBorderColor: colorPalette[i % colorPalette.length],
        pointBorderWidth: 0,
        pointStyle: "circle",
        hidden: !initialIndices.includes(indexData.name),
      }));

      console.log("Datasets prepared:", datasets);

      const chart = new Chart(globalChartCanvas, {
        type: "line",
        data: {
          labels: dates,
          datasets: datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: true,
              mode: "index",
              intersect: false,
              backgroundColor: "rgba(0, 0, 0, 0.8)", // Dark tooltip background for contrast
              titleColor: "#FFFFFF", // White tooltip title
              bodyColor: "#FFFFFF", // White tooltip body
              callbacks: {
                label: function (context) {
                  const datasetIndex = context.datasetIndex;
                  const dataIndex = context.dataIndex;
                  const indexName = context.dataset.label;
                  const baseAdjustedValue = context.dataset.data[dataIndex];
                  return `${indexName}: ${
                    baseAdjustedValue !== null
                      ? baseAdjustedValue.toFixed(2)
                      : "N/A"
                  }`;
                },
              },
            },
          },
          scales: {
            x: {
              title: {
                display: false,
              },
              grid: { display: false },
              ticks: {
                maxTicksLimit: 10,
                padding: 10,
                color: "#FFFFFF", // White tick labels
              },
              border: {
                display: false, // Hide y-axis line
              },
            },
            y: {
              title: {
                display: true,
                text: "% Growth (Base Adjusted)",
                font: { size: 14 },
                color: "#FFFFFF", // White axis title
              },
              min: 0,
              grid: {
                display: false,
                color: "rgba(255, 255, 255, 0.2)", // Light grid lines if enabled
              },
              ticks: {
                callback: function (value) {
                  return Math.round(value);
                },
                padding: 10,
                color: "#FFFFFF", // White tick labels
              },
              border: {
                display: false, // Hide y-axis line
              },
            },
          },
          interaction: {
            mode: "nearest",
            axis: "x",
            intersect: false,
          },
          layout: {
            padding: {
              top: 20,
              bottom: 20,
              left: 20,
              right: 20,
            },
          },
        },
      });

      console.log("Chart initialized successfully");

      datasets.forEach((dataset, index) => {
        const legendItem = document.createElement("div");
        legendItem.style.display = "inline-block";
        legendItem.style.margin = "0 10px";
        legendItem.style.cursor = "pointer";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !dataset.hidden;
        checkbox.style.marginRight = "5px";
        checkbox.style.verticalAlign = "middle";
        checkbox.style.accentColor = dataset.borderColor;

        const label = document.createElement("span");
        label.textContent = dataset.label;
        label.style.color = "#FFFFFF"; // White legend text
        label.style.fontSize = "12px";
        label.style.verticalAlign = "middle";

        const colorIndicator = document.createElement("span");
        colorIndicator.style.display = "inline-block";
        colorIndicator.style.width = "12px";
        colorIndicator.style.height = "12px";
        colorIndicator.style.backgroundColor = dataset.borderColor;
        colorIndicator.style.borderRadius = "50%";
        colorIndicator.style.marginRight = "5px";
        colorIndicator.style.verticalAlign = "middle";

        checkbox.addEventListener("change", () => {
          const meta = chart.getDatasetMeta(index);
          meta.hidden = !checkbox.checked;
          chart.update();
          console.log(
            `Toggled visibility for ${dataset.label}: ${!meta.hidden}`
          );
        });

        legendItem.appendChild(checkbox);
        legendItem.appendChild(colorIndicator);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
      });

      console.log("Custom legend generated");
    })
    .catch((error) => {
      console.error("API call failed:", error);
      alert("Failed to fetch indices data. Please try again.");
    });
});

// IRR Calculator
document.addEventListener("DOMContentLoaded", function () {
  $("#start_date, #end_date").datepicker({
    dateFormat: "mm/dd/yy",
    autoHide: true,
    endDate: new Date(),
    changeMonth: true,
    changeYear: true,
  });

  if (window.innerWidth < 768) {
    $("#start_date, #end_date").attr("readonly", "readonly");
  }

  document.getElementById("year").setAttribute("readonly", "readonly");
  document.getElementById("irr-result").setAttribute("readonly", "readonly");
  document.getElementById("exitValue").setAttribute("readonly", "readonly");

  const comparisonGraph = document.querySelector("#comparison-graph");
  if (!comparisonGraph) {
    console.error(
      'Comparison graph container not found. Ensure a div with id="comparison-graph" exists in the HTML.'
    );
    return;
  }

  const customLegendContainer =
    comparisonGraph.querySelector("#custom-legend-irr");
  if (!customLegendContainer) {
    console.error(
      'Custom legend container not found. Ensure a div with id="custom-legend-irr" exists inside the comparison-graph div.'
    );
    return;
  }

  const ctx = document.createElement("canvas");
  ctx.id = "irr-chart";
  comparisonGraph.insertBefore(ctx, customLegendContainer);

  comparisonGraph.classList.add("hide");
  let chartInstance = null;

  if (typeof Chart === "undefined") {
    console.error(
      "Chart.js library is not loaded. Please include the Chart.js script in your HTML."
    );
    return;
  }

  const submitBtn = document.getElementById("submit");

  submitBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const startDate = document.getElementById("start_date").value;
    const endDate = document.getElementById("end_date").value;
    const amount = document.getElementById("amount").value;
    const index = document.getElementById("index").value;

    if (!startDate || !endDate || !amount || !index) {
      alert("Please fill all required fields.");
      return;
    }

    const loader = document.createElement("div");
    loader.className = "loader";
    loader.style.cssText = "display: block; text-align: center; padding: 20px;";
    loader.innerText = "Loading...";
    comparisonGraph.appendChild(loader);
    submitBtn.disabled = true;
    submitBtn.value = "Calculating...";

    customLegendContainer.innerHTML = "";

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      amount: amount,
      index: index,
    });

    const apiUrl = `https://irr-worker.irr-calculation.workers.dev?${params.toString()}`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) throw new Error("API response not ok");
        return response.json();
      })
      .then((data) => {
        if (
          !data.data ||
          !Array.isArray(data.data) ||
          !data.data[0]?.historicalData
        ) {
          throw new Error("Invalid API response data");
        }

        document.getElementById("year").value = data.years || "0";
        document.getElementById("irr-result").value =
          data.calculated_irr || "0";
        document.getElementById("exitValue").value =
          data.value_of_investment || "0";
        /*

        const startYear = new Date(startDate).getFullYear();
        const endYear = new Date(endDate).getFullYear();

        // Create a definitive list of year labels for the chart's x-axis.
        const labels = [];
        for (let year = startYear; year <= endYear; year++) {
          labels.push(year.toString());
        }

        const baseAdjustedSeries = data.data.filter(
          (item) => item.table === "Base Adjusted Values"
        );

        const actualValuesMap = {};
        data.data
          .filter((item) => item.table === "Actual Values")
          .forEach((indexData) => {
            actualValuesMap[indexData.indexName] = indexData.historicalData.map(
              (item) => ({
                date: item.date,
                value: parseFloat(item.value) || 0,
              })
            );
          });

        const defaultIndices = ["NASDAQ 100", "NIFTY IT", "BSE IT", "NIFTY"];
        const initialIndices = [...new Set([index, ...defaultIndices])];

        const datasets = baseAdjustedSeries.map((indexData, i) => {
          // Create a map of year -> value for the current index.
          const valueMap = new Map();
          indexData.historicalData.forEach((item) => {
            const year = item.date.split("-")[2];
            valueMap.set(year, parseFloat(item.value) || 0);
          });

          // Build the dataset's data array against the definitive `labels`.
          const filteredData = labels.map((year) => valueMap.get(year) ?? null);

          const isSelectedIndex = indexData.indexName === index;
          return {
            label: indexData.indexName,
            data: filteredData,
*/
        const baseAdjusted = data.data.find(
          (item) => item.table === "Base Adjusted Values"
        );
        const labels = baseAdjusted.historicalData.map((item) => {
          const dateParts = item.date.split("-");
          return dateParts[2];
        });
        // Find the exit year from the end date input
        const endDateInput = document.getElementById("end_date").value;
        const exitYear = endDateInput.split("/")[2]; // mm/dd/yyyy
        // Find the first index of the exit year in labels
        let endIdx = labels.findIndex((year) => year === exitYear);
        if (endIdx === -1) endIdx = labels.length - 1; // fallback: use all
        // Slice labels and datasets up to and including the first exit year
        const displayLabels = labels.slice(0, endIdx + 1);

        const actualValuesMap = {};
        data.data
          .filter((item) => item.table === "Actual Values")
          .forEach((indexData) => {
            actualValuesMap[indexData.indexName] = indexData.historicalData.map(
              (item) => ({
                date: item.date,
                value: parseFloat(item.value) || 0,
              })
            );
          });

        const defaultIndices = ["NASDAQ 100", "NIFTY IT", "BSE IT", "NIFTY"];
        const initialIndices = [...new Set([index, ...defaultIndices])];

        const datasets = data.data
          .filter((item) => item.table === "Base Adjusted Values")
          .map((indexData, i) => {
            const isSelectedIndex = indexData.indexName === index;
            // Slice data to match displayLabels length
            const dataSlice = indexData.historicalData.slice(
              0,
              displayLabels.length
            );
            return {
              label: indexData.indexName,
              data: dataSlice.map((item) => parseFloat(item.value) || 0),
              borderColor: isSelectedIndex
                ? "#4FC3F7"
                : [
                    "#81D4FA",
                    "#B3E5FC",
                    "#90CAF9",
                    "#42A5F5",
                    "#B0BEC5",
                    "#80DEEA",
                    "#4DD0E1",
                    "#26C6DA",
                  ][i % 8],
              backgroundColor: "transparent",
              borderWidth: isSelectedIndex ? 4 : 2,
              fill: false,
              tension: 0,
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: isSelectedIndex
                ? "#4FC3F7"
                : [
                    "#81D4FA",
                    "#B3E5FC",
                    "#90CAF9",
                    "#42A5F5",
                    "#B0BEC5",
                    "#80DEEA",
                    "#4DD0E1",
                    "#26C6DA",
                  ][i % 8],
              pointBorderColor: isSelectedIndex
                ? "#4FC3F7"
                : [
                    "#81D4FA",
                    "#B3E5FC",
                    "#90CAF9",
                    "#42A5F5",
                    "#B0BEC5",
                    "#80DEEA",
                    "#4DD0E1",
                    "#26C6DA",
                  ][i % 8],
              pointBorderWidth: 1,
              pointStyle: "circle",
              hidden: !initialIndices.includes(indexData.indexName),
            };
          });

        if (chartInstance) {
          chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
          type: "line",
          data: {
            labels: displayLabels,
            datasets: datasets,
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                enabled: true,
                mode: "index",
                intersect: false,
                callbacks: {
                  title: function (tooltipItems) {
                    // Display the year from the x-axis label
                    return tooltipItems[0].label;
                  },
                  label: function (context) {
                    // Display only the index name and its value for each dataset
                    return `${context.dataset.label}: ${Math.round(
                      context.parsed.y
                    )}`;
                  },
                  footer: function () {
                    // Display IRR and Exit Value once in the footer
                    const irrResult =
                      document.getElementById("irr-result").value || "0";
                    const exitValue =
                      document.getElementById("exitValue").value || "0";

                    return [
                      "-----------------------",
                      `IRR: ${parseFloat(irrResult).toFixed(2)}%`,
                      `Exit Value: ${parseFloat(exitValue).toFixed(2)}`,
                    ];
                  },
                },
              },
            },
            scales: {
              x: {
                title: {
                  display: false,
                },
                grid: { display: false },
                ticks: {
                  maxTicksLimit: 10,
                  padding: 10,
                },
              },
              y: {
                title: {
                  display: true,
                  text: "% Growth (Base Adjusted)",
                  font: { size: 14 },
                },
                min: 0,
                grid: { display: false },
                ticks: {
                  callback: function (value) {
                    return Math.round(value);
                  },
                  padding: 10,
                },
              },
            },
            interaction: {
              mode: "nearest",
              axis: "x",
              intersect: false,
            },
            layout: {
              padding: {
                top: 20,
                bottom: 20,
                left: 20,
                right: 20,
              },
            },
          },
        });

        datasets.forEach((dataset, idx) => {
          const legendItem = document.createElement("div");
          legendItem.style.display = "inline-block";
          legendItem.style.margin = "0 10px";
          legendItem.style.cursor = "pointer";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = !dataset.hidden;
          checkbox.style.marginRight = "5px";
          checkbox.style.verticalAlign = "middle";
          checkbox.style.accentColor = dataset.borderColor;

          const label = document.createElement("span");
          label.textContent = dataset.label;
          label.style.color = "#333";
          label.style.fontSize = "12px";
          label.style.verticalAlign = "middle";

          const colorIndicator = document.createElement("span");
          colorIndicator.style.display = "inline-block";
          colorIndicator.style.width = "12px";
          colorIndicator.style.height = "12px";
          colorIndicator.style.backgroundColor = dataset.borderColor;
          colorIndicator.style.borderRadius = "50%";
          colorIndicator.style.marginRight = "5px";
          colorIndicator.style.verticalAlign = "middle";

          checkbox.addEventListener("change", () => {
            const meta = chartInstance.getDatasetMeta(idx);
            meta.hidden = !checkbox.checked;
            chartInstance.update();
            console.log(
              `Toggled visibility for ${dataset.label}: ${!meta.hidden}`
            );
          });

          legendItem.appendChild(checkbox);
          legendItem.appendChild(colorIndicator);
          legendItem.appendChild(label);
          customLegendContainer.appendChild(legendItem);
        });

        console.log("Custom legend generated");

        comparisonGraph.classList.remove("hide");
        document.querySelector(".irr-graph-container").classList.remove("hide");
      })
      .catch((error) => {
        console.error("API call failed:", error);
        alert("Failed to fetch IRR data. Please try again.");
      })
      .finally(() => {
        loader.remove();
        submitBtn.disabled = false;
        submitBtn.value = "Calculate IRR";
      });
  });
});
