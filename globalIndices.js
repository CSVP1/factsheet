// Global Indices Chart with ApexCharts and Dashed Grid Lines
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

  const globalChartDiv = document.createElement("div");
  globalChartDiv.id = "global-indices-chart";
  globalChartContainer.insertBefore(globalChartDiv, legendContainer);

  if (typeof ApexCharts === "undefined") {
    console.error(
      "ApexCharts library is not loaded. Please include the ApexCharts script in your HTML."
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
        "#1E6AAE", // Dark Blue
        "#2492E0", // Medium Blue
        "#5AB9F7", // Light Blue
        "#155081", // Dark Teal
        "#599ac5", // Medium Teal
        "#7ac8f8", // Light Sky Blue
        "#5a5a5a", // Dark Gray
        "#b0b0b0", // Medium Gray
        "#e5e5e5", // Light Gray
      ];

      const initialIndices = ["NASDAQ 100", "NIFTY IT", "BSE IT", "NIFTY"];

      const series = indices.map((indexData, i) => ({
        name: indexData.name,
        data: indexData.data,
        color: colorPalette[i % colorPalette.length],
        type: "line",
        lineWidth: 2,
        marker: {
          size: 5,
          strokeWidth: 0,
          fillColors: [colorPalette[i % colorPalette.length]],
          hover: {
            size: 7,
            sizeOffset: 2,
          },
        },
        stroke: {
          curve: "straight",
          width: 2,
        },
        fill: {
          type: "solid",
          opacity: 0,
        },
      }));

      console.log("Series prepared:", series);

      const chartOptions = {
        series: series,
        chart: {
          type: "line",
          height: 350,
          toolbar: {
            show: false,
          },
          animations: {
            enabled: true,
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          curve: "straight",
          width: 2,
        },
        xaxis: {
          categories: dates,
          labels: {
            style: {
              fontSize: "12px",
              fontFamily: "Poppins",
              fontWeight: 400,
              colors: ["#2E2E2E"],
            },
            maxHeight: 30,
          },
          axisBorder: {
            show: true,
            color: "#ABCAE9",
          },
          crosshairs: {
            show: true,
            stroke: {
              color: "#ABCAE9",
              width: 1,
              dashArray: 0,
            },
          },

          grid: {
            show: false,
          },
        },
        yaxis: {
          title: {
            text: "% Growth (Base Adjusted)",
            style: {
              color: "#000",
              fontSize: "12px",
              fontWeight: "600",
              fontFamily: "Poppins",
            },
          },
          min: 0,
          labels: {
            style: {
              fontSize: "12px",
              fontFamily: "Poppins",
              fontWeight: 400,
              colors: ["#2E2E2E"],
            },
            formatter: function (value) {
              return Math.round(value);
            },
          },
          axisBorder: {
            show: true,
            color: "#ABCAE9",
            width: 1,
          },
          grid: {
            show: true,
            strokeDashArray: [6, 3],
            color: "#e8e8e8",
            strokeWidth: 1,
            // show: true,
            // borderColor: "rgba(120, 144, 156, 0.2)",
            // strokeDashArray: 3,
            // // strokeDashArray: [8, 4],
            // color: "#e8e8e8",
            // strokeWidth: 1,
          },
        },
        tooltip: {
          y: {
            formatter: function (
              value,
              { series, seriesIndex, dataPointIndex, w }
            ) {
              return value !== null
                ? FormatterWithZero.format(value) + "B"
                : "N/A";
            },
          },
        },
        tooltip: {
          enabled: true,
          shared: true,
          intersect: false,
          style: {
            fontSize: "12px",
          },
          custom: function ({ series, seriesIndex, dataPointIndex, w }) {
            const year = w.globals.labels[dataPointIndex];
            let tooltipContent = `
              <div style="background:rgb(254, 254, 254); color: white; padding: 12px 16px; border-radius: 8px; font-size: 12px; min-width: 200px;">
                <div style="margin-bottom: 8px; font-weight: normal; border-bottom: 1px solid rgba(100, 97, 97, 0.3); padding-bottom: 4px; color: #333;">
                  Year: ${dates[year - 1]}
                </div>
            `;

            // Show all visible series (not just the hovered one)
            w.globals.seriesNames.forEach((seriesName, index) => {
              const seriesData = series[index];
              const value = seriesData[dataPointIndex];
              const color = w.globals.colors[index];

              // Only show if series is visible (not hidden)
              if (value !== null && value !== undefined) {
                tooltipContent += `
                  <div style="margin-bottom: 4px; display: flex; align-items: center; color: #333; ">
                    <span style="color: ${color}; font-weight: bold; margin-right: 8px;">●</span>
                    <span style="flex: 1;">${seriesName}:</span>
                    <span style="font-weight: 600;">${Math.round(value)}</span>
                  </div>
                `;
              }
            });

            tooltipContent += `</div>`;
            return tooltipContent;
          },
        },
        legend: {
          show: false,
        },
        grid: {
          show: true,
          strokeDashArray: [8, 4],
          position: "back",
          xaxis: {
            lines: {
              show: false,
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
        },
        markers: {
          size: 5,
          strokeWidth: 0,
          hover: {
            size: 7,
            sizeOffset: 2,
          },
        },
      };

      const chart = new ApexCharts(globalChartDiv, chartOptions);
      chart.render();
      // Hide series that are not in initialIndices after chart is rendered
      chart.w.globals.seriesNames.forEach((seriesName, index) => {
        if (!initialIndices.includes(seriesName)) {
          chart.hideSeries(seriesName);
        }
      });

      console.log("Chart initialized successfully");

      series.forEach((seriesData, index) => {
        const legendItem = document.createElement("div");
        legendItem.style.display = "inline-block";
        legendItem.style.margin = "0 10px";
        legendItem.style.cursor = "pointer";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = initialIndices.includes(seriesData.name);
        checkbox.style.marginRight = "5px";
        checkbox.style.verticalAlign = "middle";
        checkbox.style.accentColor = seriesData.color;

        const label = document.createElement("span");
        label.textContent = seriesData.name;
        label.style.color = "#000";
        label.style.fontSize = "12px";
        label.style.verticalAlign = "middle";

        const colorIndicator = document.createElement("span");
        colorIndicator.style.display = "inline-block";
        colorIndicator.style.width = "12px";
        colorIndicator.style.height = "12px";
        colorIndicator.style.backgroundColor = seriesData.color;
        colorIndicator.style.borderRadius = "50%";
        colorIndicator.style.marginRight = "5px";
        colorIndicator.style.verticalAlign = "middle";

        const toggleSeries = (useCheckboxState) => {
          if (useCheckboxState) {
            chart.showSeries(seriesData.name);
          } else {
            chart.hideSeries(seriesData.name);
          }
          console.log(
            `Toggled visibility for ${seriesData.name}: ${useCheckboxState}`
          );
        };

        checkbox.addEventListener("change", (event) => {
          event.stopPropagation();
          toggleSeries(checkbox.checked);
        });

        legendItem.addEventListener("click", (event) => {
          if (event.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            toggleSeries(checkbox.checked);
          }
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

// IRR Calculator with ApexCharts and Dashed Grid Lines
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

  const chartDiv = document.createElement("div");
  chartDiv.id = "irr-chart";
  comparisonGraph.insertBefore(chartDiv, customLegendContainer);

  comparisonGraph.classList.add("hide");
  let chartInstance = null;

  if (typeof ApexCharts === "undefined") {
    console.error(
      "ApexCharts library is not loaded. Please include the ApexCharts script in your HTML."
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

        // // Ensure comparisonGraph has relative positioning for absolute overlay
        comparisonGraph.style.position = "relative";

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
        let visibleIndices = [...new Set([index, ...defaultIndices])]; // Track currently visible indices

        // Get all available series
        const allSeries = data.data
          .filter((item) => item.table === "Base Adjusted Values")
          .map((indexData, i) => {
            const isSelectedIndex = indexData.indexName === index;
            // Slice data to match displayLabels length
            const dataSlice = indexData.historicalData.slice(
              0,
              displayLabels.length
            );
            return {
              name: indexData.indexName,
              data: dataSlice.map((item) => parseFloat(item.value) || 0),
              color: isSelectedIndex
                ? "#1E6AAE"
                : [
                    "#1E6AAE", // Dark Blue
                    "#2492E0", // Medium Blue
                    "#5AB9F7", // Light Blue
                    "#155081", // Dark Teal
                    "#599ac5", // Medium Teal
                    "#7ac8f8", // Light Sky Blue
                    "#5a5a5a", // Dark Gray
                    "#b0b0b0", // Medium Gray
                    "#e5e5e5", // Light Gray
                  ][i % 8],
              type: "line",
              lineWidth: isSelectedIndex ? 4 : 2,
              marker: {
                size: 3,
                strokeWidth: 0,
                fillColors: [
                  isSelectedIndex
                    ? "#1E6AAE"
                    : [
                        "#5AB9F7", // Light Blue
                        "#155081", // Dark Teal
                        "#599ac5", // Medium Teal
                        "#7ac8f8", // Light Sky Blue
                        "#5a5a5a", // Dark Gray
                        "#b0b0b0", // Medium Gray
                        "#e5e5e5", // Light Gray
                      ][i % 8],
                ],
                hover: {
                  size: 6,
                  sizeOffset: 3,
                },
              },
              stroke: {
                curve: "straight",
                width: isSelectedIndex ? 4 : 2,
              },
              fill: {
                type: "solid",
                opacity: 0,
              },
            };
          });

        // Filter to only include initial indices for rendering
        const seriesToRender = allSeries.filter((seriesData) =>
          visibleIndices.includes(seriesData.name)
        );

        if (chartInstance) {
          chartInstance.destroy();
        }

        const existingOverlay = comparisonGraph.querySelector(".irr-overlay");
        if (existingOverlay) {
          existingOverlay.remove();
        }

        const chartOptions = {
          series: seriesToRender,
          chart: {
            type: "line",
            height: 400,
            toolbar: {
              show: false,
            },
            animations: {
              enabled: true,
            },
          },
          dataLabels: {
            enabled: false,
          },
          stroke: {
            curve: "straight",
            width: 2,
          },
          xaxis: {
            categories: displayLabels,
            labels: {
              style: {
                fontSize: "12px",
                fontFamily: "Poppins",
                fontWeight: 400,
                colors: ["#2E2E2E"],
              },
              maxHeight: 30,
            },
            axisBorder: {
              show: true,
              color: "#ABCAE9",
            },
            crosshairs: {
              show: true,
              stroke: {
                color: "#ABCAE9",
                width: 1,
                dashArray: 0,
              },
            },
            grid: {
              show: false,
            },
          },
          yaxis: {
            title: {
              text: "% Growth (Base Adjusted)",
              style: {
                color: "#000",
                fontSize: "12px",
                fontWeight: "600",
                fontFamily: "Poppins",
              },
            },
            min: 0,
            labels: {
              style: {
                fontSize: "12px",
                fontFamily: "Poppins",
                fontWeight: 400,
                colors: ["#2E2E2E"],
              },
              formatter: function (value) {
                return Math.round(value);
              },
            },
            axisBorder: {
              show: true,
              color: "#ABCAE9",
              width: 1,
            },
            grid: {
              show: true,
              strokeDashArray: [6, 3],
              color: "#e8e8e8",
              strokeWidth: 1,
            },
          },
          tooltip: {
            enabled: true,
            shared: true,
            intersect: false,
            style: {
              fontSize: "12px",
            },
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
              const year = w.globals.labels[dataPointIndex];
              let tooltipContent = `
                <div style="background: #fff; color: #333; padding: 12px 16px; border-radius: 8px; font-size: 12px; min-width: 200px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid rgba(0, 0, 0, 0.1); padding-bottom: 4px; color: #333;">
                    Year: ${displayLabels[year - 1]}
                  </div>
              `;

              // Show all visible series (not just the hovered one)
              w.globals.seriesNames.forEach((seriesName, index) => {
                const seriesData = series[index];
                const value = seriesData[dataPointIndex];
                const color = w.globals.colors[index];

                // Only show if series is visible (not hidden) and has data
                if (value !== null && value !== undefined) {
                  tooltipContent += `
                    <div style="margin-bottom: 4px; display: flex; align-items: center; color: #333;">
                      <span style="color: ${color}; font-weight: bold; margin-right: 8px;">●</span>
                      <span style="flex: 1;">${seriesName}:</span>
                      <span style="font-weight: bold;">${Math.round(
                        value
                      )}%</span>
                    </div>
                  `;
                }
              });

              tooltipContent += `</div>`;
              return tooltipContent;
            },
          },
          legend: {
            show: false,
          },
          grid: {
            show: true,
            strokeDashArray: [6, 3],
            position: "back",
            xaxis: {
              lines: {
                show: false,
              },
            },
            yaxis: {
              lines: {
                show: true,
              },
            },
          },
          markers: {
            size: 5,
            strokeWidth: 0,
            hover: {
              size: 7,
              sizeOffset: 2,
            },
          },
        };

        chartInstance = new ApexCharts(chartDiv, chartOptions);
        chartInstance.render();

        // Create overlay elements
        const overlayContainer = document.createElement("div");
        overlayContainer.className = "irr-overlay";
        overlayContainer.style.position = "absolute";
        overlayContainer.style.top = "10px";
        overlayContainer.style.right = "50px";
        overlayContainer.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
        overlayContainer.style.padding = "10px 15px";
        overlayContainer.style.borderRadius = "6px";
        overlayContainer.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
        overlayContainer.style.fontSize = "12px";
        overlayContainer.style.fontWeight = "500";
        overlayContainer.style.zIndex = "1000";
        overlayContainer.style.minWidth = "150px";
        overlayContainer.style.display = "flex";
        overlayContainer.style.gap = "10px";

        const irrDisplay = document.createElement("div");
        irrDisplay.style.marginBottom = "5px";
        irrDisplay.style.color = "#1E6AAE";
        irrDisplay.innerHTML = `<strong>IRR: <span id="irr-display">0.00%</span></strong>`;

        const exitValueDisplay = document.createElement("div");
        exitValueDisplay.style.color = "#1E6AAE";
        exitValueDisplay.innerHTML = `<strong>Exit Value: <span id="exit-value-display">0.00</span></strong>`;

        overlayContainer.appendChild(irrDisplay);
        overlayContainer.appendChild(exitValueDisplay);
        comparisonGraph.appendChild(overlayContainer);

        // Function to update overlay values based on tooltip data
        const updateOverlayValues = (tooltipData = null) => {
          const irrDisplayElement =
            overlayContainer.querySelector("#irr-display");
          const exitValueDisplayElement = overlayContainer.querySelector(
            "#exit-value-display"
          );

          if (tooltipData && tooltipData.length > 0) {
            // Show values from hovered tooltip
            const selectedIndex = tooltipData.find(
              (item) => item.dataset.label === index
            );
            if (selectedIndex) {
              const hoveredValue = Math.round(selectedIndex.parsed.y);
              if (irrDisplayElement) {
                irrDisplayElement.textContent = `${hoveredValue}%`;
              }
              if (exitValueDisplayElement) {
                // Calculate exit value based on hovered percentage
                const amount = parseFloat(
                  document.getElementById("amount").value || "0"
                );
                const exitValue = amount * (hoveredValue / 100);
                exitValueDisplayElement.textContent = exitValue.toFixed(2);
              }
            }
          } else {
            // Show default values (current year/final values)
            const irrValue = document.getElementById("irr-result").value || "0";
            const exitValue = document.getElementById("exitValue").value || "0";
            const Formatter = new Intl.NumberFormat("en-IN", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });

            if (irrDisplayElement) {
              irrDisplayElement.textContent = `${parseFloat(irrValue).toFixed(
                2
              )}%`;
            }
            if (exitValueDisplayElement) {
              exitValueDisplayElement.textContent = Formatter.format(exitValue);
            }
          }
        };

        // Update overlay values initially with default values
        updateOverlayValues();

        // Create legend for all series with proper toggle functionality
        allSeries.forEach((seriesData, idx) => {
          const legendItem = document.createElement("div");
          legendItem.style.display = "inline-block";
          legendItem.style.margin = "0 10px";
          legendItem.style.cursor = "pointer";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = visibleIndices.includes(seriesData.name);
          checkbox.style.marginRight = "5px";
          checkbox.style.verticalAlign = "middle";
          checkbox.style.accentColor = seriesData.color;

          const label = document.createElement("span");
          label.textContent = seriesData.name;
          label.style.color = "#000";
          label.style.fontSize = "12px";
          label.style.verticalAlign = "middle";

          const colorIndicator = document.createElement("span");
          colorIndicator.style.display = "inline-block";
          colorIndicator.style.width = "12px";
          colorIndicator.style.height = "12px";
          colorIndicator.style.backgroundColor = seriesData.color;
          colorIndicator.style.borderRadius = "50%";
          colorIndicator.style.marginRight = "5px";
          colorIndicator.style.verticalAlign = "middle";

          const toggleSeries = (shouldShow) => {
            if (shouldShow) {
              // Add to visible indices if not already there
              if (!visibleIndices.includes(seriesData.name)) {
                visibleIndices.push(seriesData.name);
              }

              // Check if series exists in chart, if not add it
              const existingSeries = chartInstance.w.config.series.find(
                (s) => s.name === seriesData.name
              );
              if (!existingSeries) {
                chartInstance.appendSeries(seriesData);
              } else {
                chartInstance.showSeries(seriesData.name);
              }
              console.log("showSeries=====>", seriesData.name);
            } else {
              // Remove from visible indices
              visibleIndices = visibleIndices.filter(
                (item) => item !== seriesData.name
              );
              chartInstance.hideSeries(seriesData.name);
              console.log("hideSeries=====>", seriesData.name);
            }
            console.log("Current visible indices:", visibleIndices);
          };

          checkbox.addEventListener("change", (event) => {
            event.stopPropagation();
            toggleSeries(checkbox.checked);
          });

          legendItem.addEventListener("click", (event) => {
            if (event.target !== checkbox) {
              checkbox.checked = !checkbox.checked;
              toggleSeries(checkbox.checked);
            }
          });

          legendItem.appendChild(checkbox);
          legendItem.appendChild(colorIndicator);
          legendItem.appendChild(label);
          customLegendContainer.appendChild(legendItem);
        });

        console.log("Custom legend generated");

        comparisonGraph.classList.remove("hide");
        document.querySelector(".irr-graph-container").classList.remove("hide");
        comparisonGraph.scrollIntoView({ behavior: "smooth", block: "center" });
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
