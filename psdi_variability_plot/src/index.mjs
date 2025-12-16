// variability.mjs

import ttest from '../node_modules/@stdlib/stats-ttest/lib/index.js';
import ztest from '../node_modules/@stdlib/stats-ztest/lib/index.js';
import stdev from '../node_modules/@stdlib/stats-base-stdev/lib/index.js';
import { Chart, LinearScale, ScatterController, LineElement, LineController, PointElement, Filler } from '../node_modules/chart.js/dist/chart.js';

Chart.register(LinearScale, ScatterController, LineElement, LineController, PointElement, Filler);

const chartWidthInput = document.querySelector("input#chartWidth");
const chartHeightInput = document.querySelector("input#chartHeight");
const chartTypeSelect = document.querySelector("select#chartType");
const chartTitleInput = document.querySelector("input#chartTitle");
const compoundInput = document.querySelector("input#compound");
const significanceInput = document.querySelector("select#significance");
const variabilityPlotCanvas = document.querySelector("#variabilityPlot");
const variabilityPlotContainer = document.querySelector("#variabilityPlotContainer");
const notificationsDiv = document.querySelector("div#notifications");
const otherTypeInput = document.querySelector("input#otherType");
const otherTypeRowDiv = document.querySelector("div#otherTypeRow");
const noChartDiv = document.querySelector("div#noChart");
const generatePlotButton = document.querySelector("button#generatePlot");
const copyToClipboardButton = document.querySelector("button#copyToClipboard");
const downloadChartButton = document.querySelector("button#downloadChart");
const valuesAreaDiv = document.querySelector("div#valuesArea");
const addNewValueFieldButton = document.querySelector("button#addNewValueField");

// This is the cutoff value for when to stop using the t-distribution and use
// the z-distribution instead.

const tDistCutoff = 30;

function calculateVariabilityData(data, alpha) {

    const sampleCount = data.length;

    if (sampleCount < tDistCutoff) {
        return ttest(data, { alpha });
    } else {
        return ztest(data, stdev(data), { alpha });
    }
}

let currentChart;

function resetAlerts() {
    notificationsDiv.replaceChildren();
}

function showAlert(type) {

    const alert = document.querySelector(`template#${type}`).content.cloneNode(true)

    notificationsDiv.append(alert)
}

const chartTypeLabel = {
    "isolatedYield": "isolated yield",
    "spectroscopicYield": "spectroscopic yield",
    "chromatographicYield": "chromatographic yield",
    "de": "diastereomeric excess",
    "ee": "enantiomeric excess",
    "other": "other"
}

function capitalise(text) {
    return `${text.substring(0, 1).toUpperCase()}${text.substring(1)}`;
}

function generatePlot() {

    const chartWidth = parseInt(chartWidthInput.value);
    const chartHeight = parseInt(chartHeightInput.value);
    const chartType = chartTypeSelect.value;
    const otherDef = otherTypeInput.value;
    const chartTitle = chartTitleInput.value;
    const compound = compoundInput.value;
    const significance = parseFloat(significanceInput.value);

    const valueFields = Array.from(document.querySelectorAll("#valuesArea input.valueField"));

    const values = valueFields
        .map(field => parseFloat(field.value))
        .filter(value => !isNaN(value));

    let validated = true;
    let alertText = 'You need to:\n';
    let valuesText = '    enter at least three reaction outcome values\n';
    let outcomeText = '    select a reaction outcome\n';
    let otherText = "    enter a definition of 'Other'\n";
    let productText = '    enter a product label\n';

    //resetAlerts();

    if ((values === null) || (values.length < 3)) {
        //showAlert("notEnoughValues");
        validated = false;
        alertText += valuesText;
    }

    if (chartType === "noSelection") {
        //showAlert("noChartSelection");
        validated = false;
        alertText += outcomeText;
    }

    if ((chartType === "other") && (otherDef === "")) {
        validated = false;
        alertText += otherText;
    }

    if (compound === "") {
        //showAlert("noCompound");
        validated = false;
        alertText += productText;
    }

    if (alertText !== 'You need to:\n') {
        window.alert(alertText);
    }

    if (validated) {

        const results = calculateVariabilityData(values, 1 - (significance / 100));

        const customTextboxOverlayPlugin = {

            id: 'customTextboxOverlay',

            afterRender: (chart, args, options) => {

                const { ctx, chartArea } = chart;

                ctx.save();

                ctx.globalCompositeOperation = 'source-over';

                let maxWidth = 0;
                let lineTop = options.vertPadding
                let lineInfo = [];

                for (const line of options.lines) {

                    const measure = ctx.measureText(line);
                    const lineHeight = measure.fontBoundingBoxAscent + measure.fontBoundingBoxDescent;

                    maxWidth = Math.max(maxWidth, measure.width);

                    lineInfo.push({ line, measure, lineTop, lineHeight });

                    lineTop += lineHeight + options.interLinePadding;
                }

                const lastLine = lineInfo[lineInfo.length - 1];

                const boxWidth = options.horizPadding * 2 + maxWidth;
                const boxHeight = lastLine.lineTop + lastLine.lineHeight + options.vertPadding;
                const boxLeft = chartArea.right - boxWidth - options.rightMargin;
                const boxTop = chartArea.bottom - boxHeight - options.bottomMargin;

                ctx.fillStyle = options.backgroundColor;
                ctx.fillRect(boxLeft, boxTop, boxWidth, boxHeight);

                ctx.strokeStyle = options.borderColor;
                ctx.lineWidth = options.borderWidth;
                ctx.strokeRect(boxLeft, boxTop, boxWidth, boxHeight);

                for (const line of lineInfo) {

                    ctx.fillStyle = options.fontColor;
                    ctx.fillText(line.line,
                        boxLeft + options.horizPadding + (maxWidth - line.measure.width) / 2,
                        boxTop + line.lineTop + line.measure.fontBoundingBoxAscent);
                }

                // ctx.fillRect(
                //     chartArea.right - textboxWidth - rightMargin,
                //     chartArea.bottom - textboxHeight - bottomMargin,
                //     textboxWidth,
                //     textboxHeight);

                ctx.restore();
            },
            defaults: {
                lines: ["Legend line 1", "Second line"],
                backgroundColor: "#eee",
                borderColor: "#888",
                fontColor: "black",
                borderWidth: 1,
                horizPadding: 5,
                vertPadding: 5,
                rightMargin: 10,
                bottomMargin: 10,
                interLinePadding: 0
            }
        }

        const customBackgroundPlugin = {
            id: 'customBackgroundPlugin',
            beforeDraw: (chart, args, options) => {
                const { ctx } = chart;
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        };

        // Generate the chart.

        const mean = values.reduce((acc, current) => acc + current, 0.0) / values.length;

        const lowerConfidenceBound = Math.round(results.ci[0]);
        const upperConfidenceBound = Math.round(results.ci[1]);

        const legendText1 = `Mean yield = ${Math.round(mean)}%`;
        const legendText2 =
            `${significance}% Confidence interval: ${lowerConfidenceBound}% to ${upperConfidenceBound}%`;

        var otherTypeText = otherTypeInput.value.trim();
        otherTypeText = otherTypeText.replace('(%)', '').trim();
        otherTypeText = otherTypeText.replace('%', '').trim();

        const chartTypeText = chartType !== "other" ? chartTypeLabel[chartType] : otherTypeText;

        // const title = 'Yield of Lactam 4a';
        const title = `${capitalise(chartTitle)} for the ${chartTypeText} of ${compound}`;

        const xLabel = "Iteration";
        const yLabel = `${capitalise(chartTypeText)} of ${compound} (%)`;

        const ctx = document.getElementById('variabilityPlot').getContext('2d');

        const labels = values;

        if (currentChart !== undefined) {
            currentChart.destroy();
        }

        variabilityPlotCanvas.setAttribute("width", chartWidth);
        variabilityPlotCanvas.setAttribute("height", chartHeight);

        const scatterPlotData = values.map((number, index) => ({ x: index + 1, y: number }));

        const devicePixelRatio = parseInt(document.querySelector("#devicePixelRatio").value);

        currentChart = new Chart(ctx, {

            data: {

                labels,

                datasets: [
                    {
                        // Reaction outcomes.

                        type: 'scatter',
                        data: scatterPlotData,
                        backgroundColor: 'rgba(75, 92, 92, 1)',
                    },
                    {
                        // Lower confidence bound.

                        type: 'line',
                        data: [[0, lowerConfidenceBound], [values.length + 1, lowerConfidenceBound]],
                        borderColor: 'rgba(0, 0, 0, 0)',
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        pointStyle: false,
                        fill: "+2",
                    },
                    {
                        // Mean line.

                        type: 'line',
                        data: [[0, mean], [values.length + 1, mean]],
                        borderColor: 'rgba(64, 64, 255)',
                        pointStyle: false,
                    },
                    {
                        // Upper confidence bound.

                        type: 'line',
                        data: [[0, upperConfidenceBound], [values.length + 1, upperConfidenceBound]],
                        borderColor: 'rgba(0, 0, 0, 0)',
                        pointStyle: false,
                    },
                ],
            },

            plugins: [customBackgroundPlugin, customTextboxOverlayPlugin],

            options: {

                responsive: false,

                devicePixelRatio,

                animation: {
                    duration: 0,
                },

                plugins: {
                    datalabels: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: title,
                    },
                    legend: {
                        display: false,
                    },
                    customTextboxOverlay: {
                        lines: [legendText1, legendText2],
                        backgroundColor: "#ffffff80",
                        borderColor: "#888"
                    },
                },

                scales: {
                    y: {
                        type: 'linear',
                        min: 0,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        },
                        title: {
                            display: true,
                            text: yLabel
                        },
                    },
                    x: {
                        type: 'linear',
                        min: 0.8,
                        max: values.length + 0.2,
                        ticks: {
                            precision: 0,
                            includeBounds: false,
                        },
                        title: {
                            display: true,
                            text: xLabel
                        },
                    },
                },
            },
        });

        variabilityPlotContainer.hidden = false;

        noChartDiv.hidden = true;
        noChartDiv.style.display = "none";
    }
}

function changeOtherTypeVisibility() {
    otherTypeRowDiv.hidden = chartTypeSelect.value !== "other";

    if (chartTypeSelect.value !== "other") {
        otherTypeInput.value = "";
    } else {
        otherTypeInput.focus();
    }
}

async function copyToClipboard() {

    // Async/await method replacing toBlob() callback

    async function getBlobFromCanvas(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Canvas toBlob failed"));
                }
            });
        });
    }

    // Copy canvas to blob

    const copySuccess = document.querySelector("#copySuccess");
    const copyFailure = document.querySelector("#copyFailure");

    try {
        const blob = await getBlobFromCanvas(variabilityPlotCanvas);
        // Create ClipboardItem with blob and it's type, and add to an array
        const data = [new ClipboardItem({ [blob.type]: blob })];
        // Write the data to the clipboard
        await navigator.clipboard.write(data);

        copySuccess.hidden = false;

        setTimeout(() => copySuccess.hidden = true, 2000);

    } catch (error) {

        copyFailure.hidden = false;

        setTimeout(() => copyFailure.hidden = true, 2000);
    }
}

function downloadChart() {

    const anchor = document.createElement('a');

    anchor.href = currentChart.toBase64Image();
    anchor.download = 'plot.png';

    anchor.click();
}

function addNewValueField(count) {

    for (let n = 0; n < count; n++) {

        const newValue = document.querySelector(`template#newValueField`).content.cloneNode(true)

        valuesAreaDiv.append(newValue)
    }
}

generatePlotButton.addEventListener("click", generatePlot);
chartTypeSelect.addEventListener("change", changeOtherTypeVisibility);
copyToClipboardButton.addEventListener("click", copyToClipboard);
downloadChartButton.addEventListener("click", downloadChart);
addNewValueFieldButton.addEventListener("click", () => addNewValueField(1));

addNewValueField(5)
