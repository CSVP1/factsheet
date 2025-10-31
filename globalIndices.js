// Global Indices Chart with ApexCharts and Smooth Animations
document.addEventListener("DOMContentLoaded", function () {
  // Global Indices Chart
  const globalChartContainer = document.querySelector("#chart");
  if (!globalChartContainer) {
    console.error(
      'Chart  container not found. Ensure a div with id="chart" exists in the HTML.'
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

      const allIndices = data.data
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

      if (allIndices.length !== Object.keys(actualValuesMap).length) {
        console.warn(
          "Mismatch in number of series:",
          allIndices.length,
          "indices vs",
          Object.keys(actualValuesMap).length,
          "actual values"
        );
      }
      allIndices.forEach((index, i) => {
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

      // Create all series with colors
      const allSeries = allIndices.map((indexData, i) => ({
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

      // Filter to only initial series for rendering
      const seriesToRender = allSeries.filter((s) =>
        initialIndices.includes(s.name)
      );

      console.log("Series prepared:", seriesToRender);

      const chartOptions = {
        series: seriesToRender,
        chart: {
          type: "line",
          height: 350,
          toolbar: {
            show: false,
          },
          animations: {
            enabled: true,
            easing: "easeinout",
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150,
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350,
            },
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

      console.log("Chart initialized successfully");

      // Create legend for all series
      allSeries.forEach((seriesData, index) => {
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

        const toggleSeries = (shouldShow) => {
          if (shouldShow) {
            // Check if series exists in chart
            const existingSeries = chart.w.config.series.find(
              (s) => s.name === seriesData.name
            );
            if (!existingSeries) {
              // Add series with animation
              chart.appendSeries(seriesData);
            } else {
              chart.showSeries(seriesData.name);
            }
          } else {
            chart.hideSeries(seriesData.name);
          }
          console.log(
            `Toggled visibility for ${seriesData.name}: ${shouldShow}`
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

// IRR Calculator with ApexCharts and Smooth Animations
document.addEventListener("DOMContentLoaded", function () {
  function getLastDayOfPreviousQuarter(currentDate) {
    const date = new Date(currentDate);
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;
    let previousQuarter, previousQuarterYear;

    if (currentQuarter === 1) {
      previousQuarter = 4;
      previousQuarterYear = currentYear - 1;
    } else {
      previousQuarter = currentQuarter - 1;
      previousQuarterYear = currentYear;
    }

    let lastDate;
    if (previousQuarter === 1) {
      lastDate = new Date(previousQuarterYear, 2, 31); // March 31
    } else if (previousQuarter === 2) {
      lastDate = new Date(previousQuarterYear, 5, 30); // June 30
    } else if (previousQuarter === 3) {
      lastDate = new Date(previousQuarterYear, 8, 30); // September 30
    } else {
      lastDate = new Date(previousQuarterYear, 11, 31); // December 31
    }

    return lastDate;
  }

  // Determine endDate: use specific date if required, else last day of previous quarter
  const endDate = getLastDayOfPreviousQuarter(new Date());
  $("#start_date, #end_date").datepicker({
    dateFormat: "mm/dd/yy",
    autoHide: true,
    endDate: endDate, // if required validation till specific date then new Date("2025-09-30") else new Date() which work to get the current as Last date
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

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const minDate = new Date("01/01/2014");

    // Check if investment date is greater than 01-01-2014
    if (startDateObj < minDate) {
      alert("Investment date must be greater than 01/01/2014.");
      return;
    }

    // Check if exit date is greater than investment date
    if (endDateObj < startDateObj) {
      alert("Exit date must be greater than the investment date.");
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

        // Parse the exit date from the input (format: mm/dd/yyyy)
        const endDateInput = document.getElementById("end_date").value;
        const [exitMonth, exitDay, exitYear] = endDateInput
          .split("/")
          .map(Number);
        const exitDate = new Date(exitYear, exitMonth - 1, exitDay); // month is 0-indexed
        // Find the last data point that is <= the exit date
        let endIdx = -1;
        baseAdjusted.historicalData.forEach((item, index) => {
          // Parse the item date - handle both string dates and numeric dates
          let itemDate;
          if (typeof item.date === "string") {
            // Handle string dates (format: YYYY-MM-DD or similar)
            const dateParts = item.date.split("-");
            if (dateParts.length >= 3) {
              itemDate = new Date(
                parseInt(dateParts[0]),
                parseInt(dateParts[1]) - 1,
                parseInt(dateParts[2])
              );
            } else {
              // Fallback: try parsing as-is
              itemDate = new Date(item.date);
            }
          } else if (typeof item.date === "number") {
            // Handle numeric dates (Excel serial date format)
            itemDate = new Date((item.date - 25569) * 86400 * 1000);
          } else {
            itemDate = new Date(item.date);
          }

          // Check if this date is <= exit date
          if (itemDate <= exitDate) {
            endIdx = index;
          }
        });

        // If no match found, use all data
        if (endIdx === -1) {
          endIdx = baseAdjusted.historicalData.length - 1;
        }

        // Create labels and slice to the correct end index
        const labels = baseAdjusted.historicalData
          .slice(0, endIdx + 1)
          .map((item) => {
            const dateParts = item.date.toString().split("-");
            if (dateParts.length >= 3) {
              return dateParts[2];
            }
            // Fallback: extract year from date
            let itemDate;
            if (typeof item.date === "number") {
              itemDate = new Date((item.date - 25569) * 86400 * 1000);
            } else {
              itemDate = new Date(item.date);
            }
            return itemDate;
          });

        const displayLabels = labels.map((item) =>
          new Date(item).toLocaleDateString("en-GB")
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

        // Add the invested index to defaultIndices if not already present
        if (!defaultIndices.includes(index)) {
          // TODO: Add more indices to defaultIndices if required
          // if index is DJX, then add DJIA to defaultIndices
          // if index is BOM, then add SENSEX to defaultIndices
          // if index is SP, then add S&P 500 to defaultIndices
          // else add the index to defaultIndices
          if (index.split(":")[0].replace("INDEX", "") === "DJX") {
            defaultIndices.push("DJIA");
          } else if (index.split(":")[0].replace("INDEX", "") === "BOM") {
            defaultIndices.push("SENSEX");
          } else if (index.split(":")[0].replace("INDEX", "") === "SP") {
            defaultIndices.push("S&P 500");
          } else {
            defaultIndices.push(index.split(":")[0].replace("INDEX", ""));
          }
        }

        let visibleIndices = [...defaultIndices];

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

        // function yearDifference(date1, date2) {
        //   const [day1, month1, year1] = date1.split("/").map(Number);
        //   const [day2, month2, year2] = date2.split("/").map(Number);

        //   const d1 = new Date(year1, month1 - 1, day1);
        //   const d2 = new Date(year2, month2 - 1, day2);

        //   let years = year2 - year1;
        //   let months = month2 - month1;
        //   let days = day2 - day1;

        //   // Adjust for negative days
        //   if (days < 0) {
        //     months -= 1;
        //     const prevMonth = new Date(year2, month2 - 1, 0); // last day of previous month
        //     days += prevMonth.getDate();
        //   }

        //   // Adjust for negative months
        //   if (months < 0) {
        //     years -= 1;
        //     months += 12;
        //   }

        //   // Calculate decimal year difference (approx)
        //   const totalYears = years + months / 12 + days / 365;

        //   return {
        //     years,
        //     months,
        //     days,
        //     yearDifferenceCeil: Math.ceil(totalYears),
        //   };
        // }
        function yearDifference(startDate, endDate) {
          // Parse the input dates (expected format: MM/DD/YYYY)
          const [startMonth, startDay, startYear] = startDate
            .split("/")
            .map(Number);
          const [endMonth, endDay, endYear] = endDate.split("/").map(Number);

          // Create Date objects
          const d1 = new Date(startYear, startMonth - 1, startDay);
          const d2 = new Date(endYear, endMonth - 1, endDay);

          // Calculate raw differences
          let years = endYear - startYear;
          let months = endMonth - startMonth;
          let days = endDay - startDay;

          // Adjust for negative days
          if (days < 0) {
            months -= 1;
            const prevMonth = new Date(endYear, endMonth - 1, 0); // last day of previous month
            days += prevMonth.getDate();
          }

          // Adjust for negative months
          if (months < 0) {
            years -= 1;
            months += 12;
          }

          // Calculate total difference in milliseconds
          const diffMs = d2 - d1;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          const totalYears = diffDays / 365.25; // average year length including leap years

          return {
            years,
            months,
            days,
            yearDifferenceCeil: +totalYears.toFixed(2),
          };
        }

        // Example usage
        console.log(
          "hryyyy=>",
          data?.input?.start_date,
          Math.ceil(
            yearDifference(data?.input?.start_date, data?.input?.end_date)
              .yearDifferenceCeil
          ) + 1
        );

        // Get all available series
        const allSeries = data.data
          .filter((item) => item.table === "Base Adjusted Values")
          .map((indexData, i) => {
            const isSelectedIndex = indexData.indexName === index;
            const dataSlice = indexData.historicalData.slice(
              0,
              Math.ceil(
                yearDifference(data?.input?.start_date, data?.input?.end_date)
                  .yearDifferenceCeil
              ) + 1
            );
            return {
              name: indexData.indexName,
              data: dataSlice.map((item) => parseFloat(item.value) || 0),
              color: isSelectedIndex
                ? "#1E6AAE"
                : colorPalette[i % colorPalette.length],
              type: "line",
              lineWidth: isSelectedIndex ? 4 : 2,
              marker: {
                size: 3,
                strokeWidth: 0,
                fillColors: [
                  isSelectedIndex
                    ? "#1E6AAE"
                    : colorPalette[i % colorPalette.length],
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
              easing: "easeinout",
              speed: 800,
              animateGradually: {
                enabled: true,
                delay: 150,
              },
              dynamicAnimation: {
                enabled: true,
                speed: 350,
              },
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
            categories: displayLabels.map((item) =>
              new Date(item).getFullYear().toString()
            ),
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
                      )}</span>
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
