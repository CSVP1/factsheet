document.addEventListener("DOMContentLoaded", async function () {
  console.log("Starting chart initialization at", new Date().toISOString());

  // Fallback years for structure (no data values)
  const fallbackYears = [
    "2000",
    "2005",
    "2010",
    "2015",
    "2020",
    "2024",
    "2025",
    "2030",
  ];
  const fallbackGrowthYears = ["2021", "2022", "2023", "2024", "2025"];
  const countries = ["India", "China", "United States", "Brazil", "Japan"];

  // Fetch data
  let sheets = {};
  try {
    console.log("Fetching data from API...");
    const response = await fetch(
      "https://irr-worker.irr-calculation.workers.dev?type=india-fact-sheet"
    );
    if (!response.ok)
      throw new Error(`Network response was not ok: ${response.status}`);
    sheets = (await response.json()).sheets || {};
    console.log("API data fetched:", JSON.stringify(sheets, null, 2));
  } catch (error) {
    console.error("Error fetching API data:", error);
    sheets = {
      "Nominal GDP": {},
      "Real GDP Growth (%)": {},
      "GDP Per Capita": {},
      Population: {},
      "Unemployment Rate (%)": {},
      "Inflation Rate": {},
      "Median Age": {},
      "10-year Government Bond Yields": {},
      "Merchandise Trade Statistics": {},
      "Share of A,I,S in GDP": {},
      "Annual Returns of Major Indices": {},
    };
  }

  // Extract sheets
  const nominalGdpSheet = sheets["Nominal GDP"] || {};
  const realGdpGrowthSheet = sheets["Real GDP Growth (%)"] || {};
  const gdpPerCapitaSheet = sheets["GDP Per Capita"] || {};
  const populationSheet = sheets["Population"] || {};
  const unemploymentRateSheet = sheets["Unemployment Rate"] || {};
  const inflationRateSheet = sheets["Inflation Rate"] || {};
  const medianAgeSheet = sheets["Median Age"] || {};
  const governmentBondSheet = sheets["10-year Government Bond Yields"] || {};
  const merchandiseTradeSheet = sheets["Merchandise Trade Statistics"] || {};
  const shareAISSheet = sheets["Share of A,I,S in GDP"] || {};
  const annualReturnsSheet = sheets["Annual Returns of Major Indices"] || {};

  // Get years for each metric
  const getYears = (sheet, country, fallback) => {
    const years = Object.keys(sheet[country] || {})
      .filter((year) => !isNaN(year))
      .sort();
    return years.length >= 2
      ? years
      : [
          ...new Set([
            ...years,
            ...fallback.slice(0, Math.max(2 - years.length, 1)),
          ]),
        ].sort();
  };

  const years = getYears(nominalGdpSheet, "India", fallbackYears);
  const realGdpYears = getYears(
    realGdpGrowthSheet,
    "India",
    fallbackGrowthYears
  );
  const populationYears = getYears(populationSheet, "India", fallbackYears);
  const unemploymentYears = getYears(
    unemploymentRateSheet,
    "India",
    fallbackGrowthYears
  );
  const inflationYears = getYears(
    inflationRateSheet,
    "India",
    fallbackGrowthYears
  );
  const medianAgeYears = getYears(medianAgeSheet, "India", fallbackYears);
  const bondYears = getYears(governmentBondSheet, "India", fallbackGrowthYears);
  const merchandiseYears = Object.keys(merchandiseTradeSheet).sort();
  const shareAISYears = Object.keys(shareAISSheet["Agriculture"] || {}).sort();
  const annualReturnsYears = Object.keys(
    annualReturnsSheet["SENSEX"] || {}
  ).sort();

  console.log("Years:", {
    years,
    realGdpYears,
    populationYears,
    unemploymentYears,
    inflationYears,
    medianAgeYears,
    bondYears,
    merchandiseYears,
    shareAISYears,
    annualReturnsYears,
  });

  // Create series data
  const createSeries = (sheet, years, selectedCountry = null) => {
    if (!sheet || (selectedCountry && !sheet[selectedCountry])) {
      console.warn(`No data for ${selectedCountry || "countries"} in sheet`);
      return selectedCountry
        ? [{ name: selectedCountry, data: years.map(() => null) }]
        : countries.map((country) => ({
            name: country,
            data: years.map((year) => sheet[country]?.[year] || null),
          }));
    }
    return selectedCountry
      ? [
          {
            name: selectedCountry,
            data: years.map((year) => sheet[selectedCountry]?.[year] || null),
          },
        ]
      : countries.map((country) => ({
          name: country,
          data: years.map((year) => sheet[country]?.[year] || null),
        }));
  };

  const createMerchandiseSeries = (sheet, years) => {
    const exportsData = years.map((year) => sheet[year]?.Exports || null);
    const importsData = years.map((year) => sheet[year]?.Imports || null);
    const surplusDeficitData = years.map(
      (year) => sheet[year]?.["Surplus/Deficit"] || null
    );
    return [
      { name: "Exports", data: exportsData },
      { name: "Imports", data: importsData },
      { name: "Surplus/Deficit", data: surplusDeficitData },
    ];
  };

  const DollarCurrencyFormatter = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
    currency: "USD",
  });
  const DollarZeroCurrencyFormatter = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    style: "currency",
    currency: "USD",
  });

  const Formatter = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const FormatterWithZero = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const createShareAISSeries = (sheet, years) => {
    return [
      {
        name: "Agriculture",
        data: years.map((year) => sheet["Agriculture"]?.[year] || null),
      },
      {
        name: "Industry",
        data: years.map((year) => sheet["Industry"]?.[year] || null),
      },
      {
        name: "Services",
        data: years.map((year) => sheet["Services"]?.[year] || null),
      },
    ];
  };

  const createAnnualReturnsSeries = (sheet, years) => {
    const indices = Object.keys(sheet || {});
    return indices.map((index) => ({
      name: index,
      data: years.map((year) => sheet[index]?.[year] || null),
    }));
  };

  const seriesData = {
    nominalGdp: createSeries(nominalGdpSheet, years, "India"),
    nominalGdpAll: createSeries(nominalGdpSheet, years),
    realGdpGrowth: createSeries(realGdpGrowthSheet, realGdpYears, "India"),
    realGdpGrowthAll: createSeries(realGdpGrowthSheet, realGdpYears),
    gdpPerCapita: createSeries(gdpPerCapitaSheet, years, "India"),
    gdpPerCapitaAll: createSeries(gdpPerCapitaSheet, years),
    population: createSeries(populationSheet, populationYears, "India"),
    populationAll: createSeries(populationSheet, populationYears),
    unemploymentRate: createSeries(
      unemploymentRateSheet,
      unemploymentYears,
      "India"
    ),
    unemploymentRateAll: createSeries(unemploymentRateSheet, unemploymentYears),
    inflationRate: createSeries(inflationRateSheet, inflationYears, "India"),
    inflationRateAll: createSeries(inflationRateSheet, inflationYears),
    medianAge: createSeries(medianAgeSheet, medianAgeYears, "India"),
    medianAgeAll: createSeries(medianAgeSheet, medianAgeYears),
    governmentBond: createSeries(governmentBondSheet, bondYears, "India"),
    governmentBondAll: createSeries(governmentBondSheet, bondYears),
    merchandiseTrade: createMerchandiseSeries(
      merchandiseTradeSheet,
      merchandiseYears
    ),
    merchandiseTradeAll: createMerchandiseSeries(
      merchandiseTradeSheet,
      merchandiseYears
    ),
    shareAIS: createShareAISSeries(shareAISSheet, shareAISYears),
    annualReturns: createAnnualReturnsSeries(
      annualReturnsSheet,
      annualReturnsYears
    ),
  };
  console.log("Series data:", JSON.stringify(seriesData, null, 2));

  // Update info-div with 2025 data
  const updateInfoDiv = (chartId, sheet, unit = "") => {
    const container = document.querySelector(`#${chartId}`);
    if (!container) {
      console.warn(`Chart container #${chartId} not found`);
      return;
    }
    const card = container.closest(".graph-card");
    if (!card) {
      console.warn(`Graph card for ${chartId} not found`);
      return;
    }
    const dataCount = card.querySelector(".india-data-count");
    const estimateText = card.querySelector(".estimation-text");
    if (!dataCount || !estimateText) {
      console.warn(
        `Data count or estimation text elements missing for ${chartId}`
      );
      return;
    }
    const year = "2025";
    const value = sheet["India"]?.[year] || null;

    dataCount.textContent =
      value !== null
        ? chartId === "nominalGdpChart" || chartId === "gdpPerCapita"
          ? `${DollarCurrencyFormatter.format(value)} ${unit}`
          : chartId === "populationChart"
          ? `${Formatter.format(value)} ${unit}`
          : // ? `${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${unit}`
            `${Formatter.format(value)} ${unit}`
        : "N/A";
    estimateText.textContent =
      value !== null ? `${year} Estimate` : "Data not available";
  };

  updateInfoDiv("nominalGdpChart", nominalGdpSheet, "Bn");
  updateInfoDiv("realGDPGrowth", realGdpGrowthSheet, "%");
  updateInfoDiv("gdpPerCapita", gdpPerCapitaSheet);
  updateInfoDiv("populationChart", populationSheet, "M");
  updateInfoDiv("unemploymentRateChart", unemploymentRateSheet, "%");
  updateInfoDiv("governmentBondChart", governmentBondSheet, "%");
  updateInfoDiv("MerchandiseChart", merchandiseTradeSheet, "B");
  updateInfoDiv("agricultureChart", shareAISSheet, "%");
  updateInfoDiv("annualReturnsChart", annualReturnsSheet, "%");
  updateInfoDiv("detailedMedianAge", medianAgeSheet, "years");
  updateInfoDiv("detailedInflationRate", inflationRateSheet, "%");

  // Common chart options
  const commonOptions = {
    chart: { type: "line", height: 150, toolbar: { show: false } },
    xaxis: {
      title: { text: "Year" },
      labels: { style: { colors: "#9ca3af" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false, min: 0 },
    grid: {
      show: true,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
    },
    stroke: {
      curve: "smooth",
      width: 2,
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
        },
      },
    },
    colors: ["#1e40af"],
    markers: { size: 0, strokeWidth: 0, hover: { size: 0 } },
    dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
    tooltip: {
      enabled: true,
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const value = series[seriesIndex][dataPointIndex];
        const unit =
          w.config.chart.id.includes("realGDPGrowth") ||
          w.config.chart.id.includes("unemploymentRateChart") ||
          w.config.chart.id.includes("governmentBondChart") ||
          w.config.chart.id.includes("annualReturnsChart")
            ? "%"
            : w.config.chart.id.includes("populationChart")
            ? "M"
            : w.config.chart.id.includes("merchandiseChart")
            ? "B"
            : w.config.chart.id.includes("nominalGdpChart") // ||  w.config.chart.id.includes("gdpPerCapita")
            ? "Bn"
            : "";
        return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
            ${w.globals.seriesNames[seriesIndex]}: ${
          value !== null
            ? (w.config.chart.id.includes("nominalGdpChart") ||
              w.config.chart.id.includes("gdpPerCapita")
                ? // ? "$" + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  DollarZeroCurrencyFormatter.format(value)
                : value.toFixed(2)) + unit
            : "N/A"
        }
          </div>`;
      },
    },
    dataLabels: { enabled: false },
  };

  // Common detailed chart options
  const commonDetailedOptions = {
    chart: { type: "line", height: 400, toolbar: { show: false } },
    xaxis: {
      title: { text: "Year" },
      labels: { style: { colors: "#9ca3af" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: true, min: 0 },
    grid: {
      show: false,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
    },
    stroke: {
      curve: "smooth",
      width: 2,
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
        },
      },
    },
    colors: ["#000080", "#FF0000", "#00FF00", "#800080", "#00CED1"],
    markers: {
      size: 4,
      strokeWidth: 2,
      strokeColors: "#ffffff",
      hover: { size: 6, sizeOffset: 3 },
    },
    dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
    tooltip: {
      enabled: true,
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const value = series[seriesIndex][dataPointIndex];
        const unit =
          w.config.chart.id.includes("realGDPGrowth") ||
          w.config.chart.id.includes("unemploymentRateChart") ||
          w.config.chart.id.includes("governmentBondChart") ||
          w.config.chart.id.includes("annualReturnsChart")
            ? "%"
            : w.config.chart.id.includes("populationChart")
            ? "M"
            : w.config.chart.id.includes("merchandiseChart")
            ? "B"
            : w.config.chart.id.includes("gdpPerCapita")
            ? ""
            : "";
        return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
            ${w.globals.seriesNames[seriesIndex]}: ${
          value !== null
            ? (w.config.chart.id.includes("gdpPerCapita")
                ? "$" + value.toFixed(2)
                : value.toFixed(2)) + unit
            : "N/A"
        }
          </div>`;
      },
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      markers: { shape: "rectangle", width: 15, height: 5 },
    },
  };

  // Render chart function
  const renderChart = (containerId, options, estimateText) => {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Chart container #${containerId} not found`);
        return;
      }
      const chart = new ApexCharts(container, options);
      chart.render();
      console.log(`Chart ${containerId} rendered successfully`);

      const estimateLabel = document.createElement("div");
      estimateLabel.style.position = "absolute";
      estimateLabel.style.top = "20px";
      estimateLabel.style.right = "20px";
      estimateLabel.style.color = "#1e40af";
      estimateLabel.style.fontSize = "24px";
      estimateLabel.style.fontWeight = "bold";
      estimateLabel.textContent = estimateText;
      container.appendChild(estimateLabel);
    } catch (err) {
      console.error(`Failed to render chart ${containerId}:`, err);
    }
  };

  // Helper function to determine annotation year
  const getAnnotationYear = (years, sheet, key = "India") => {
    return years.includes("2025") && sheet[key]?.["2025"] != null
      ? "2025"
      : years.includes("2024") && sheet[key]?.["2024"] != null
      ? "2024"
      : null;
  };

  // Render charts
  renderChart(
    "nominalGdpChart",
    {
      ...commonOptions,
      chart: { ...commonOptions.chart, id: "nominalGdpChart" },
      xaxis: { ...commonOptions.xaxis, categories: years },
      series: seriesData.nominalGdp,
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: { size: 0 },
        discrete: [
          {
            seriesIndex: 0,
            dataPointIndex: years.indexOf("2025"),
            fillColor: "#1e40af",
            strokeColor: "#ffffff",
            size: 6,
          },
        ],
      },
      dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
          const year = getAnnotationYear(years, nominalGdpSheet);
          return opts.w.globals.labels[opts.dataPointIndex] === year
            ? val !== null
              ? //  "$" +
                //   val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
                //   " Bn"
                DollarZeroCurrencyFormatter.format(val) + " Bn"
              : "N/A"
            : "";
        },
        style: { fontSize: "12px", colors: ["#1e40af"] },
        offsetY: -15,
        background: {
          enabled: true,
          foreColor: "#fff",
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: "#ddd",
          opacity: 0.9,
        },
        enabledOnSeries: [0],
        textAnchor: "middle",
        distributed: false,
        hideOverlappingLabels: true,
      },
      annotations: {
        points: (() => {
          const year = getAnnotationYear(years, nominalGdpSheet);
          if (!year) return [];
          return [
            {
              x: year,
              y: nominalGdpSheet["India"]?.[year] || null,
              marker: {
                size: 6,
                fillColor: "#1e40af",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                // text: `${year}\n$${(nominalGdpSheet["India"]?.[year] || 0)
                //   .toFixed(0)
                //   .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} Bn`,
                text: `${year}\n${DollarZeroCurrencyFormatter.format(
                  nominalGdpSheet["India"]?.[year] || 0
                )} Bn`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#1e40af",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    nominalGdpSheet["India"]?.["2025"]
      ? // ? `$${nominalGdpSheet["India"]["2025"]
        //     .toFixed(0)
        //     .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} Bn 2025 Estimate`
        `${DollarZeroCurrencyFormatter.format(
          nominalGdpSheet["India"]["2025"]
        )} Bn 2025 Estimate`
      : "Data not available"
  );

  renderChart(
    "realGDPGrowth",
    {
      ...commonOptions,
      chart: { ...commonOptions.chart, id: "realGDPGrowth" },
      xaxis: { ...commonOptions.xaxis, categories: realGdpYears },
      series: seriesData.realGdpGrowth,
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: { size: 0 },
        discrete: [
          {
            seriesIndex: 0,
            dataPointIndex: realGdpYears.indexOf("2025"),
            fillColor: "#1e40af",
            strokeColor: "#ffffff",
            size: 6,
          },
        ],
      },
      dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
          const year = getAnnotationYear(realGdpYears, realGdpGrowthSheet);
          return opts.w.globals.labels[opts.dataPointIndex] === year
            ? val !== null
              ? val.toFixed(2) + "%"
              : "N/A"
            : "";
        },
        style: { fontSize: "12px", colors: ["#1e40af"] },
        offsetY: -15,
        background: {
          enabled: true,
          foreColor: "#fff",
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: "#ddd",
          opacity: 0.9,
        },
        enabledOnSeries: [0],
        textAnchor: "middle",
        distributed: false,
        hideOverlappingLabels: true,
      },
      annotations: {
        points: (() => {
          const year = getAnnotationYear(realGdpYears, realGdpGrowthSheet);
          if (!year) return [];
          return [
            {
              x: year,
              y: realGdpGrowthSheet["India"]?.[year] || null,
              marker: {
                size: 6,
                fillColor: "#1e40af",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                text: `${year}\n${(
                  realGdpGrowthSheet["India"]?.[year] || 0
                ).toFixed(2)}%`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#1e40af",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    realGdpGrowthSheet["India"]?.["2025"]
      ? `${realGdpGrowthSheet["India"]["2025"].toFixed(2)}% 2025 Estimate`
      : "Data not available"
  );

  renderChart(
    "gdpPerCapita",
    {
      ...commonOptions,
      chart: { ...commonOptions.chart, id: "gdpPerCapita" },
      xaxis: { ...commonOptions.xaxis, categories: years },
      series: seriesData.gdpPerCapita,
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: { size: 0 },
        discrete: [
          {
            seriesIndex: 0,
            dataPointIndex: years.indexOf("2025"),
            fillColor: "#1e40af",
            strokeColor: "#ffffff",
            size: 6,
          },
        ],
      },
      dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
          const year = getAnnotationYear(years, gdpPerCapitaSheet);
          return opts.w.globals.labels[opts.dataPointIndex] === year
            ? val !== null
              ? "$" + val.toFixed(2)
              : "N/A"
            : "";
        },
        style: { fontSize: "12px", colors: ["#1e40af"] },
        offsetY: -15,
        background: {
          enabled: true,
          foreColor: "#fff",
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: "#ddd",
          opacity: 0.9,
        },
        enabledOnSeries: [0],
        textAnchor: "middle",
        distributed: false,
        hideOverlappingLabels: true,
      },
      annotations: {
        points: (() => {
          const year = getAnnotationYear(years, gdpPerCapitaSheet);
          if (!year) return [];
          return [
            {
              x: year,
              y: gdpPerCapitaSheet["India"]?.[year] || null,
              marker: {
                size: 6,
                fillColor: "#1e40af",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                text: `${year}\n$${(
                  gdpPerCapitaSheet["India"]?.[year] || 0
                ).toFixed(2)}`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#1e40af",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    gdpPerCapitaSheet["India"]?.["2025"]
      ? `$${gdpPerCapitaSheet["India"]["2025"].toFixed(2)} 2025 Estimate`
      : "Data not available"
  );

  renderChart(
    "populationChart",
    {
      ...commonOptions,
      chart: { ...commonOptions.chart, id: "populationChart", type: "bar" },
      xaxis: {
        ...commonOptions.xaxis,
        categories: ["India"],
        title: { text: "Country" },
      },
      yaxis: {
        ...commonOptions.yaxis,
        min: 0,
        max: 2000,
        labels: {
          formatter: (val) => `${Formatter.format(val)} M`,
          // `${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} M`,
        },
      },
      series: [
        { name: "India", data: [populationSheet["India"]?.["2025"] || null] },
      ],
      annotations: {
        points: (() => {
          const year = getAnnotationYear(populationYears, populationSheet);
          if (!year) return [];
          return [
            {
              x: "India",
              y: populationSheet["India"]?.[year] || null,
              marker: {
                size: 6,
                fillColor: "#1e40af",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                // text: `${year}\n${(populationSheet["India"]?.[year] || 0)
                //   .toFixed(2)
                //   .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} M`,
                text: `${year}\n${Formatter.format(
                  populationSheet["India"]?.[year] || 0
                )} M`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#1e40af",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    populationSheet["India"]?.["2025"]
      ? // ? `${populationSheet["India"]["2025"]
        //     .toFixed(2)
        //     .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} M 2025 Estimate`
        `${Formatter.format(populationSheet["India"]["2025"])} M 2025 Estimate`
      : "Data not available"
  );

  renderChart(
    "unemploymentRateChart",
    {
      ...commonOptions,
      chart: { ...commonOptions.chart, id: "unemploymentRateChart" },
      xaxis: { ...commonOptions.xaxis, categories: unemploymentYears },
      yaxis: { ...commonOptions.yaxis, min: 0, max: 10 },
      series: seriesData.unemploymentRate,
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: { size: 0 },
        discrete: [
          {
            seriesIndex: 0,
            dataPointIndex: unemploymentYears.indexOf("2025"),
            fillColor: "#1e40af",
            strokeColor: "#ffffff",
            size: 6,
          },
        ],
      },
      dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
          const year = getAnnotationYear(
            unemploymentYears,
            unemploymentRateSheet
          );
          return opts.w.globals.labels[opts.dataPointIndex] === year
            ? val !== null
              ? val.toFixed(2) + "%"
              : "N/A"
            : "";
        },
        style: { fontSize: "12px", colors: ["#1e40af"] },
        offsetY: -15,
        background: {
          enabled: true,
          foreColor: "#fff",
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: "#ddd",
          opacity: 0.9,
        },
        enabledOnSeries: [0],
        textAnchor: "middle",
        distributed: false,
        hideOverlappingLabels: true,
      },
      annotations: {
        points: (() => {
          const year = getAnnotationYear(
            unemploymentYears,
            unemploymentRateSheet
          );
          if (!year) return [];
          return [
            {
              x: year,
              y: unemploymentRateSheet["India"]?.[year] || null,
              marker: {
                size: 6,
                fillColor: "#1e40af",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                text: `${year}\n${(
                  unemploymentRateSheet["India"]?.[year] || 0
                ).toFixed(2)}%`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#1e40af",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    unemploymentRateSheet["India"]?.["2025"]
      ? `${unemploymentRateSheet["India"]["2025"].toFixed(2)}% 2025 Estimate`
      : "Data not available"
  );

  // Update for governmentBondChart to add % to y-axis values
  renderChart(
    "governmentBondChart",
    {
      ...commonOptions,
      chart: {
        ...commonOptions.chart,
        id: "governmentBondChart",
        type: "line",
        height: 220,
      },
      xaxis: { ...commonOptions.xaxis, categories: bondYears },
      yaxis: {
        ...commonOptions.yaxis,
        max: 15,
        labels: { formatter: (val) => `${val.toFixed(1)}%` },
      },
      series: seriesData.governmentBond,
      colors: ["#1e40af"],
      annotations: {
        points: (() => {
          const year = getAnnotationYear(bondYears, governmentBondSheet);
          if (!year) return [];
          return [
            {
              x: year,
              y: governmentBondSheet["India"]?.[year] || null,
              marker: {
                size: 6,
                fillColor: "#1e40af",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                text: `${year}\n${(
                  governmentBondSheet["India"]?.[year] || 0
                ).toFixed(2)}%`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#1e40af",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    governmentBondSheet["India"]?.["2025"]
      ? `${governmentBondSheet["India"]["2025"].toFixed(2)}% 2025 Estimate`
      : "Data not available"
  );
  renderChart(
    "MerchandiseChart",
    {
      ...commonOptions,
      chart: { ...commonOptions.chart, id: "merchandiseChart", height: 220 },
      xaxis: { ...commonOptions.xaxis, categories: merchandiseYears },
      yaxis: { ...commonOptions.yaxis, min: -500, max: 750 },
      series: seriesData.merchandiseTrade,
      colors: ["#1e40af", "#dc2626", "#65a30d"],
      annotations: {
        points: (() => {
          const year =
            merchandiseYears.includes("2025") &&
            merchandiseTradeSheet["2025"]?.Exports != null
              ? "2025"
              : merchandiseYears.includes("2024-25") &&
                merchandiseTradeSheet["2024-25"]?.Exports != null
              ? "2024-25"
              : null;
          if (!year) return [];
          return [
            {
              x: year,
              y: merchandiseTradeSheet[year]?.Exports || null,
              marker: {
                size: 6,
                fillColor: "#1e40af",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                text: `${year}\n${(
                  merchandiseTradeSheet[year]?.Exports || 0
                ).toFixed(2)}`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#1e40af",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    merchandiseTradeSheet["2025"]?.Exports
      ? `${merchandiseTradeSheet["2025"].Exports.toFixed(2)}B 2025 Estimate`
      : merchandiseTradeSheet["2024-25"]?.Exports
      ? `${merchandiseTradeSheet["2024-25"].Exports.toFixed(
          2
        )}B 2024-25 Estimate`
      : "Data not available"
  );

  renderChart(
    "agricultureChart",
    {
      ...commonOptions,
      chart: {
        ...commonOptions.chart,
        id: "agricultureChart",
        type: "bar",
        height: 220,
      },
      xaxis: { ...commonOptions.xaxis, categories: shareAISYears },
      yaxis: {
        show: true,
        min: 0,
        max: 70,
        tickAmount: 7, // Show 7 ticks to align with multiples of 10 (0, 10, 20, 30, 40, 50, 60, 70)
        labels: { formatter: (val) => `${Math.round(val)}%` }, // Remove decimal and show as 10%, 20%, etc.
      },
      series: seriesData.shareAIS,
      colors: ["#1e40af", "#dc2626", "#65a30d"],
      plotOptions: { bar: { horizontal: false, columnWidth: "55%" } },
      annotations: {
        points: (() => {
          const year = getAnnotationYear(
            shareAISYears,
            shareAISSheet,
            "Services"
          );
          if (!year) return [];
          return [
            {
              x: year,
              y: shareAISSheet["Services"]?.[year] || null,
              marker: {
                size: 6,
                fillColor: "#65a30d",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                text: `${year}\n${(
                  shareAISSheet["Services"]?.[year] || 0
                ).toFixed(2)}%`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#65a30d",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    shareAISSheet["Services"]?.["2025"]
      ? `${shareAISSheet["Services"]["2025"].toFixed(2)}% 2025 Estimate`
      : "Data not available"
  );

  renderChart(
    "annualReturnsChart-sensex",
    {
      ...commonOptions,
      chart: {
        ...commonOptions.chart,
        id: "annualReturnsChart-sensex",
        height: 220,
      },
      xaxis: {
        ...commonOptions.xaxis,
        categories: annualReturnsYears,
        title: { text: "Sensex" },
      },
      yaxis: { ...commonOptions.yaxis, min: 0, max: 80000 },
      series: [
        {
          name: "SENSEX",
          data:
            seriesData.annualReturns.find((s) => s.name === "SENSEX")?.data ||
            annualReturnsYears.map(() => null),
        },
      ],
      colors: ["#1e40af"],
      legend: { show: false },
      tooltip: {
        enabled: true,
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const value = series[seriesIndex][dataPointIndex];
          return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
              ${w.globals.seriesNames[seriesIndex]}: ${
            value !== null ? value.toFixed(2) : "N/A"
          }
            </div>`;
        },
      },
      annotations: {
        points: (() => {
          const year = getAnnotationYear(
            annualReturnsYears,
            annualReturnsSheet,
            "SENSEX"
          );
          if (!year) return [];
          return [
            {
              x: year,
              y: annualReturnsSheet["SENSEX"]?.[year] || null,
              marker: {
                size: 6,
                fillColor: "#1e40af",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                text: `${year}\n${(
                  annualReturnsSheet["SENSEX"]?.[year] || 0
                ).toFixed(2)}`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#1e40af",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    annualReturnsSheet["SENSEX"]?.["2025"]
      ? `${annualReturnsSheet["SENSEX"]["2025"].toFixed(2)} 2025 Estimate`
      : "Data not available"
  );

  // Update for annualReturnsChart-nifty to remove legend and set x-axis label to "Nifty graph"
  renderChart(
    "annualReturnsChart-nifty",
    {
      ...commonOptions,
      chart: {
        ...commonOptions.chart,
        id: "annualReturnsChart-nifty",
        height: 220,
      },
      xaxis: {
        ...commonOptions.xaxis,
        categories: annualReturnsYears,
        title: { text: "Nifty" },
      },
      yaxis: { ...commonOptions.yaxis, min: 0, max: 80000 },
      series: [
        {
          name: "NIFTY",
          data:
            seriesData.annualReturns.find((s) => s.name === "NIFTY")?.data ||
            annualReturnsYears.map(() => null),
        },
      ],
      colors: ["#dc2626"],
      legend: { show: false },
      tooltip: {
        enabled: true,
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const value = series[seriesIndex][dataPointIndex];
          return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
              ${w.globals.seriesNames[seriesIndex]}: ${
            value !== null ? value.toFixed(2) : "N/A"
          }
            </div>`;
        },
      },
      annotations: {
        points: (() => {
          const year = getAnnotationYear(
            annualReturnsYears,
            annualReturnsSheet,
            "NIFTY"
          );
          if (!year) return [];
          return [
            {
              x: year,
              y: annualReturnsSheet["NIFTY"]?.[year] || null,
              marker: {
                size: 6,
                fillColor: "#dc2626",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                text: `${year}\n${(
                  annualReturnsSheet["NIFTY"]?.[year] || 0
                ).toFixed(2)}`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#dc2626",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    annualReturnsSheet["NIFTY"]?.["2025"]
      ? `${annualReturnsSheet["NIFTY"]["2025"].toFixed(2)} 2025 Estimate`
      : "Data not available"
  );

  renderChart(
    "medianAgeChart",
    {
      ...commonOptions,
      chart: { ...commonOptions.chart, id: "medianAgeChart" },
      xaxis: { ...commonOptions.xaxis, categories: medianAgeYears },
      yaxis: { ...commonOptions.yaxis, min: 0, max: 60 },
      series: seriesData.medianAge,
      annotations: {
        points: (() => {
          const year = getAnnotationYear(medianAgeYears, medianAgeSheet);
          if (!year) return [];
          return [
            {
              x: year,
              y: medianAgeSheet["India"]?.[year] || null,
              marker: {
                size: 6,
                fillColor: "#1e40af",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                text: `${year}\n${(
                  medianAgeSheet["India"]?.[year] || 0
                ).toFixed(2)}`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#1e40af",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    medianAgeSheet["India"]?.["2025"]
      ? `${medianAgeSheet["India"]["2025"].toFixed(2)} 2025 Estimate`
      : "Data not available"
  );

  renderChart(
    "inflationRateChart",
    {
      ...commonOptions,
      chart: { ...commonOptions.chart, id: "inflationRateChart" },
      xaxis: { ...commonOptions.xaxis, categories: inflationYears },
      yaxis: { ...commonOptions.yaxis, min: 0, max: 20 },
      series: seriesData.inflationRate,
      annotations: {
        points: (() => {
          const year = getAnnotationYear(inflationYears, inflationRateSheet);
          if (!year) return [];
          return [
            {
              x: year,
              y: inflationRateSheet["India"]?.[year] || null,
              marker: {
                size: 6,
                fillColor: "#1e40af",
                strokeColor: "#fff",
                radius: 2,
              },
              label: {
                text: `${year}\n${(
                  inflationRateSheet["India"]?.[year] || 0
                ).toFixed(2)}%`,
                position: "top",
                offsetY: -15,
                style: {
                  color: "#1e40af",
                  background: "#fff",
                  padding: "4px",
                  borderRadius: "4px",
                },
              },
            },
          ];
        })(),
      },
    },
    inflationRateSheet["India"]?.["2025"]
      ? `${inflationRateSheet["India"]["2025"].toFixed(2)}% 2025 Estimate`
      : "Data not available"
  );

  // Setup popup function
  const setupPopup = (chartContainerId, detailedOptions, chartId) => {
    try {
      const chartContainer = document.getElementById(chartContainerId);
      if (!chartContainer) {
        console.error(`Chart container #${chartContainerId} not found`);
        return;
      }
      const card = chartContainer.closest(".graph-card");
      if (!card) {
        console.error(`Graph card for ${chartId} not found`);
        return;
      }
      const viewMoreBtn = card.querySelector(".view-more-details");
      const popup = card.querySelector(".detailed-graph");
      if (!viewMoreBtn || !popup) {
        console.error(`Popup elements missing for ${chartId}:`, {
          viewMoreBtn: !!viewMoreBtn,
          popup: !!popup,
        });
        return;
      }

      let closeBtn = card.querySelector(".close-popup");
      if (!closeBtn) {
        closeBtn = document.createElement("button");
        closeBtn.className = "close-popup";
        closeBtn.innerHTML =
          '<img src="https://cdn.prod.website-files.com/67b335768e385a91073ba17b/687f83ad247e24c84a0ae9a3_X.svg" alt="Close" style="width: 16px; height: 16px;">';
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "10px";
        closeBtn.style.right = "10px";
        closeBtn.style.padding = "5px";
        closeBtn.style.background = "#ffffff";
        closeBtn.style.color = "#fff";
        closeBtn.style.border = "none";
        closeBtn.style.borderRadius = "4px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.display = "flex";
        closeBtn.style.alignItems = "center";
        closeBtn.style.justifyContent = "center";
        popup.appendChild(closeBtn);
      }

      viewMoreBtn.removeEventListener("click", handleViewMoreClick);
      viewMoreBtn.addEventListener("click", handleViewMoreClick);
      function handleViewMoreClick(e) {
        e.preventDefault();
        console.log(`Opening popup for ${chartId}`);
        popup.style.display = "flex";
        const container = document.getElementById(chartId);
        if (!container) {
          console.error(`Detailed chart container #${chartId} not found`);
          return;
        }
        try {
          const existingChart = ApexCharts.getChartByID(chartId);
          if (existingChart) {
            existingChart.destroy();
            console.log(`Existing detailed chart ${chartId} destroyed`);
          }
          const detailedChart = new ApexCharts(container, {
            ...detailedOptions,
            chart: { ...detailedOptions.chart, id: chartId },
          });
          detailedChart.render();
          console.log(`Detailed chart ${chartId} rendered`);
        } catch (err) {
          console.error(`Failed to render detailed chart ${chartId}:`, err);
        }
      }

      closeBtn.removeEventListener("click", handleCloseClick);
      closeBtn.addEventListener("click", handleCloseClick);
      function handleCloseClick(e) {
        e.preventDefault();
        console.log(`Closing popup for ${chartId}`);
        popup.style.display = "none";
        const detailedChart = ApexCharts.getChartByID(chartId);
        if (detailedChart) {
          detailedChart.destroy();
          console.log(`Detailed chart ${chartId} destroyed`);
        }
      }

      popup.removeEventListener("click", handleBackgroundClick);
      popup.addEventListener("click", handleBackgroundClick);
      function handleBackgroundClick(e) {
        if (e.target === popup) {
          console.log(`Closing popup for ${chartId} via background click`);
          popup.style.display = "none";
          const detailedChart = ApexCharts.getChartByID(chartId);
          if (detailedChart) {
            detailedChart.destroy();
            console.log(`Detailed chart ${chartId} destroyed`);
          }
        }
      }
    } catch (err) {
      console.error(`Error setting up popup for ${chartId}:`, err);
    }
  };

  if (document.getElementById("nominalGdpChart")) {
    setupPopup(
      "nominalGdpChart",
      {
        chart: {
          type: "line",
          height: 400,
          toolbar: { show: false },
          id: "detailedNominalGdpChart",
        },
        xaxis: {
          title: { text: "Year" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: years,
        },
        yaxis: { show: true, min: 0 },
        grid: {
          show: true,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        stroke: {
          curve: "smooth",
          width: 2,
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
            },
          },
        },
        colors: ["#000080", "#FF0000", "#00FF00", "#800080", "#00CED1"],
        markers: {
          size: 4,
          strokeWidth: 2,
          strokeColors: "#ffffff",
          hover: { size: 6, sizeOffset: 3 },
        },
        dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
              ${w.globals.seriesNames[seriesIndex]}: ${
              value !== null
                ? // ? "$" +
                  //   value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
                  //   " Bn"
                  DollarZeroCurrencyFormatter.format(value) + " Bn"
                : "N/A"
            }
            </div>`;
          },
        },
        dataLabels: { enabled: false },
        series: seriesData.nominalGdpAll,
        legend: {
          show: true,
          markers: { shape: "rectangle", width: 15, height: 5 },
        },
      },
      "detailedNominalGdpChart"
    );
  }

  if (document.getElementById("realGDPGrowth")) {
    setupPopup(
      "realGDPGrowth",
      {
        chart: {
          type: "line",
          height: 400,
          toolbar: { show: false },
          id: "detailedrealGDPGrowth",
        },
        xaxis: {
          title: { text: "Year" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: realGdpYears,
        },
        yaxis: { show: true, min: 0 },
        grid: {
          show: false,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        stroke: {
          curve: "smooth",
          width: 2,
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
            },
          },
        },
        colors: ["#000080", "#FF0000", "#00FF00", "#800080", "#00CED1"],
        markers: {
          size: 4,
          strokeWidth: 2,
          strokeColors: "#ffffff",
          hover: { size: 6, sizeOffset: 3 },
        },
        dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
              ${w.globals.seriesNames[seriesIndex]}: ${
              value !== null ? value.toFixed(2) + "%" : "N/A"
            }
            </div>`;
          },
        },
        dataLabels: { enabled: false },
        legend: {
          show: true,
          markers: { shape: "rectangle", width: 15, height: 5 },
        },
        series: seriesData.realGdpGrowthAll,
      },
      "detailedrealGDPGrowth"
    );
  }

  if (document.getElementById("gdpPerCapita")) {
    setupPopup(
      "gdpPerCapita",
      {
        chart: {
          type: "line",
          height: 400,
          toolbar: { show: false },
          id: "detailedgdpPerCapita",
        },
        xaxis: {
          title: { text: "Year" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: years,
        },
        yaxis: { show: true, min: 0 },
        grid: {
          show: true,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        stroke: {
          curve: "smooth",
          width: 2,
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
            },
          },
        },
        colors: ["#000080", "#FF0000", "#00FF00", "#800080", "#00CED1"],
        markers: {
          size: 4,
          strokeWidth: 2,
          strokeColors: "#ffffff",
          hover: { size: 6, sizeOffset: 3 },
        },
        dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
              ${w.globals.seriesNames[seriesIndex]}: ${
              value !== null ? "$" + value.toFixed(2) : "N/A"
            }
            </div>`;
          },
        },
        dataLabels: { enabled: false },
        series: seriesData.gdpPerCapitaAll,
        legend: {
          show: true,
          markers: { shape: "rectangle", width: 15, height: 5 },
        },
      },
      "detailedgdpPerCapita"
    );
  }

  if (document.getElementById("populationChart")) {
    setupPopup(
      "populationChart",
      {
        chart: {
          type: "bar",
          height: 400,
          toolbar: { show: false },
          id: "detailedPopulationChart",
        },
        xaxis: {
          title: { text: "Country" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: countries,
        },
        yaxis: {
          show: true,
          min: 0,
          max: 2000,
          labels: {
            formatter: (val) => `${Formatter.format(val)} M`,
            // `${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} M`,
          },
        },
        grid: {
          show: false,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "40%",
            distributed: true,
          },
        },
        colors: ["#000080", "#FF0000", "#00FF00", "#800080", "#00CED1"],
        dataLabels: { enabled: false },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            const formatter = new Intl.NumberFormat("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
                        ${w.globals.labels[dataPointIndex]}: ${
              value !== null
                ? // ? value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " M"
                  formatter.format(value) + " M"
                : "N/A"
            }
                    </div>`;
          },
        },
        series: [
          {
            name: "Population",
            data: countries.map(
              (country) =>
                populationSheet[country]?.["2025"] ||
                populationSheet[country]?.["2024"] ||
                null
            ),
          },
        ],
        legend: { show: false },
      },
      "detailedPopulationChart"
    );
  }

  if (document.getElementById("unemploymentRateChart")) {
    setupPopup(
      "unemploymentRateChart",
      {
        chart: {
          type: "line",
          height: 400,
          toolbar: { show: false },
          id: "detailedUnemploymentRateChart",
        },
        xaxis: {
          title: { text: "Year" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: unemploymentYears,
        },
        yaxis: {
          show: true,
          min: 0,
          max: 10,
          labels: { formatter: (val) => `${val.toFixed(1)}%` },
        },
        grid: {
          show: true,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: true } },
        },
        stroke: {
          curve: "smooth",
          width: 2,
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
            },
          },
        },
        colors: ["#1e40af"],
        markers: {
          size: 4,
          strokeWidth: 2,
          strokeColors: "#ffffff",
          hover: { size: 6, sizeOffset: 3 },
        },
        dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
              ${w.globals.seriesNames[seriesIndex]}: ${
              value !== null ? value.toFixed(2) + "%" : "N/A"
            }
            </div>`;
          },
        },
        dataLabels: { enabled: false },
        series: seriesData.unemploymentRate,
        legend: { show: false },
      },
      "detailedUnemploymentRateChart"
    );
  }

  // Update for detailedGovernmentBondChart to add % to y-axis values
  if (document.getElementById("governmentBondChart")) {
    setupPopup(
      "governmentBondChart",
      {
        chart: {
          type: "line",
          height: 400,
          toolbar: { show: false },
          id: "detailedGovernmentBondChart",
        },
        xaxis: {
          title: { text: "Year" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: bondYears,
        },
        yaxis: {
          show: true,
          min: 0,
          max: 15,
          labels: { formatter: (val) => `${val.toFixed(1)}%` },
        },
        grid: {
          show: false,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        stroke: {
          curve: "smooth",
          width: 2,
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
            },
          },
        },
        colors: ["#000080", "#FF0000", "#00FF00", "#800080", "#00CED1"],
        markers: {
          size: 4,
          strokeWidth: 2,
          strokeColors: "#ffffff",
          hover: { size: 6, sizeOffset: 3 },
        },
        dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
            ${w.globals.seriesNames[seriesIndex]}: ${
              value !== null ? value.toFixed(2) + "%" : "N/A"
            }
          </div>`;
          },
        },
        dataLabels: { enabled: false },
        legend: {
          show: true,
          markers: { shape: "rectangle", width: 15, height: 5 },
        },
        series: seriesData.governmentBondAll,
      },
      "detailedGovernmentBondChart"
    );
  }

  if (document.getElementById("MerchandiseChart")) {
    setupPopup(
      "MerchandiseChart",
      {
        chart: {
          type: "line",
          height: 400,
          toolbar: { show: false },
          id: "detailedMerchandiseChart",
        },
        xaxis: {
          title: { text: "Year" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: merchandiseYears,
        },
        yaxis: { show: true, min: -500, max: 750 },
        grid: {
          show: true,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        stroke: {
          curve: "smooth",
          width: 2,
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
            },
          },
        },
        colors: ["#1e40af", "#dc2626", "#65a30d"],
        markers: {
          size: 4,
          strokeWidth: 2,
          strokeColors: "#ffffff",
          hover: { size: 6, sizeOffset: 3 },
        },
        dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
              ${w.globals.seriesNames[seriesIndex]}: ${
              value !== null ? value.toFixed(2) + "B" : "N/A"
            }
            </div>`;
          },
        },
        dataLabels: { enabled: false },
        series: seriesData.merchandiseTradeAll,
      },
      "detailedMerchandiseChart"
    );
  }

  if (document.getElementById("agricultureChart")) {
    setupPopup(
      "agricultureChart",
      {
        chart: {
          type: "bar",
          height: 400,
          toolbar: { show: false },
          id: "detailedAgricultureChart",
        },
        xaxis: {
          title: { text: "Year" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: shareAISYears,
        },
        yaxis: { show: true, min: 0, max: 70 },
        grid: {
          show: true,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        stroke: {
          curve: "smooth",
          width: 2,
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
            },
          },
        },
        colors: ["#1e40af", "#dc2626", "#65a30d"],
        plotOptions: { bar: { horizontal: false, columnWidth: "55%" } },
        markers: {
          size: 4,
          strokeWidth: 2,
          strokeColors: "#ffffff",
          hover: { size: 6, sizeOffset: 3 },
        },
        dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
              ${w.globals.seriesNames[seriesIndex]}: ${
              value !== null ? value.toFixed(2) + "%" : "N/A"
            }
            </div>`;
          },
        },
        dataLabels: { enabled: false },
        series: seriesData.shareAIS,
      },
      "detailedAgricultureChart"
    );
  }

  if (document.getElementById("annualReturnsChart-sensex")) {
    setupPopup(
      "annualReturnsChart-sensex",
      {
        chart: {
          type: "line",
          height: 400,
          toolbar: { show: false },
          id: "detailedAnnualReturnsChart-sensex",
        },
        xaxis: {
          title: { text: "Sensex" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: annualReturnsYears,
        },
        yaxis: { show: true, min: 0, max: 80000 },
        grid: {
          show: true,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        stroke: {
          curve: "smooth",
          width: 2,
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
            },
          },
        },
        colors: ["#1e40af"],
        markers: {
          size: 4,
          strokeWidth: 2,
          strokeColors: "#ffffff",
          hover: { size: 6, sizeOffset: 3 },
        },
        dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
                ${w.globals.seriesNames[seriesIndex]}: ${
              value !== null ? value.toFixed(2) : "N/A"
            }
              </div>`;
          },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        series: [
          {
            name: "SENSEX",
            data:
              seriesData.annualReturns.find((s) => s.name === "SENSEX")?.data ||
              annualReturnsYears.map(() => null),
          },
        ],
      },
      "detailedAnnualReturnsChart-sensex"
    );
  }

  // Update for detailedAnnualReturnsChart-nifty to remove legend and set x-axis label to "Nifty graph"
  if (document.getElementById("annualReturnsChart-nifty")) {
    setupPopup(
      "annualReturnsChart-nifty",
      {
        chart: {
          type: "line",
          height: 400,
          toolbar: { show: false },
          id: "detailedAnnualReturnsChart-nifty",
        },
        xaxis: {
          title: { text: "Nifty" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: annualReturnsYears,
        },
        yaxis: { show: true, min: 0, max: 80000 },
        grid: {
          show: true,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        stroke: {
          curve: "smooth",
          width: 2,
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
            },
          },
        },
        colors: ["#dc2626"],
        markers: {
          size: 4,
          strokeWidth: 2,
          strokeColors: "#ffffff",
          hover: { size: 6, sizeOffset: 3 },
        },
        dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
                ${w.globals.seriesNames[seriesIndex]}: ${
              value !== null ? value.toFixed(2) : "N/A"
            }
              </div>`;
          },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        series: [
          {
            name: "NIFTY",
            data:
              seriesData.annualReturns.find((s) => s.name === "NIFTY")?.data ||
              annualReturnsYears.map(() => null),
          },
        ],
      },
      "detailedAnnualReturnsChart-nifty"
    );
  }

  if (document.getElementById("detailedMedianAge")) {
    setupPopup(
      "detailedMedianAge",
      {
        chart: {
          type: "line",
          height: 400,
          toolbar: { show: false },
          id: "detailedMedianAge",
        },
        xaxis: {
          title: { text: "Year" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: medianAgeYears,
        },
        yaxis: {
          show: true,
          min: 0,
          max: 60,
          title: { text: "Age" },
          labels: { formatter: (val) => `${Math.round(val)}` },
        },
        grid: {
          show: false,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        stroke: {
          curve: "smooth",
          width: 2,
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
            },
          },
        },
        colors: ["#000080", "#FF0000", "#00FF00", "#800080", "#00CED1"],
        markers: {
          size: 4,
          strokeWidth: 2,
          strokeColors: "#ffffff",
          hover: { size: 6, sizeOffset: 3 },
        },
        dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
                ${w.globals.seriesNames[seriesIndex]}: ${
              value !== null ? value.toFixed(2) : "N/A"
            }
              </div>`;
          },
        },
        dataLabels: { enabled: false },
        legend: {
          show: true,
          markers: { shape: "rectangle", width: 15, height: 5 },
        },
        series: seriesData.medianAgeAll,
      },
      "detailedMedianAge"
    );
  }

  if (document.getElementById("detailedInflationRate")) {
    setupPopup(
      "detailedInflationRate",
      {
        chart: {
          type: "line",
          height: 400,
          toolbar: { show: false },
          id: "detailedInflationRate",
        },
        xaxis: {
          title: { text: "Year" },
          labels: { style: { colors: "#9ca3af" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          categories: inflationYears,
        },
        yaxis: {
          show: true,
          min: 0,
          max: 20,
          labels: { formatter: (val) => `${Math.round(val)}%` },
        },
        grid: {
          show: false,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        stroke: {
          curve: "smooth",
          width: 2,
          dashArray: inflationYears.map((year) =>
            parseInt(year) >= 2025 ? 5 : 0
          ),
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
            },
          },
        },
        colors: ["#1e40af"],
        markers: {
          size: 4,
          strokeWidth: 2,
          strokeColors: "#ffffff",
          hover: { size: 6, sizeOffset: 3 },
        },
        dropShadow: { enabled: true, top: 0, left: 0, blur: 4, opacity: 0.1 },
        tooltip: {
          enabled: true,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const value = series[seriesIndex][dataPointIndex];
            return `<div style="padding: 5px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px;">
                ${w.globals.seriesNames[seriesIndex]}: ${
              value !== null ? value.toFixed(2) + "%" : "N/A"
            }
              </div>`;
          },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        series: seriesData.inflationRate,
      },
      "detailedInflationRate"
    );
  }

  console.log("Chart initialization completed at", new Date().toISOString());
});
