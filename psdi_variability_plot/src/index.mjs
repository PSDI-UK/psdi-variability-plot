// index.mjs

import ttest from '../node_modules/@stdlib/stats-ttest/lib/index.js';
import ztest from '../node_modules/@stdlib/stats-ztest/lib/index.js';
import stdev from '../node_modules/@stdlib/stats-base-stdev/lib/index.js';
import { Chart, LinearScale, ScatterController, LineElement, LineController, PointElement, Filler } from '../node_modules/chart.js/dist/chart.js';

Chart.register(LinearScale, ScatterController, LineElement, LineController, PointElement, Filler);

const numberOfValuesInput = document.querySelector("input#numValues");
const chartWidthInput = document.querySelector("input#chartWidth");
const chartHeightInput = document.querySelector("input#chartHeight");
const chartTypeSelect = document.querySelector("select#chartType");
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
const copySuccess = document.querySelector("#copySuccess");
const copyFailure = document.querySelector("#copyFailure");

var nextValueIndex = 0;

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

function getValues() {
    var values = [];

    for (var i = 0; i < nextValueIndex; i++) {
        const val = parseFloat(document.getElementById("value-" + i).value);

        if (!isNaN(val)) {
            values.push(val);
        }
    }

    return values;
}

function generatePlot() {

    const chartWidth = parseInt(chartWidthInput.value);
    const chartHeight = parseInt(chartHeightInput.value);
    const chartType = chartTypeSelect.value;
    const otherDef = otherTypeInput.value;
//    const chartTitle = chartTitleInput.value;
    const compound = compoundInput.value;
    const significance = parseFloat(significanceInput.value);

    //const valueFields = Array.from(document.querySelectorAll("#valuesArea input.valueField"));
    const values = getValues();

    //const values = valueFields
        //.map(field => parseFloat(field.value))
        //.filter(value => !isNaN(value));

    let validated = true;
    let alertText = 'You need to:\n';
    let valuesText = '    enter at least three reaction outcome values\n';
    let outcomeText = '    select a reaction outcome\n';
    let otherText = "    enter a definition of 'Other'\n";
    let productText = '    enter a product label\n';

    if ((values === null) || (values.length < 3)) {
        validated = false;
        alertText += valuesText;
    }

    if (chartType === "noSelection") {
        validated = false;
        alertText += outcomeText;
    }

    if ((chartType === "other") && (otherDef === "")) {
        validated = false;
        alertText += otherText;
    }

    if (compound === "") {
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
//        const title = `${capitalise(chartTitle)} for the ${chartTypeText} of ${compound}`;

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
//                    title: {
//                        display: true,
//                        text: title,
//                    },
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

        prepareToCopy();
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

async function copyToClipboard(e) {

    // Write the data to the clipboard

    try {
        await navigator.clipboard.write(e.currentTarget.data);

        copySuccess.hidden = false;

        setTimeout(() => copySuccess.hidden = true, 2000);
    } catch (error) {

        copyFailure.hidden = false;

        setTimeout(() => copyFailure.hidden = true, 2000);
    }
}

async function prepareToCopy() {

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

    try {
        const blob = await getBlobFromCanvas(variabilityPlotCanvas);
        // Create ClipboardItem with blob and its type, and add to an array
        const data = [new ClipboardItem({ [blob.type]: blob })];
        copyToClipboardButton.data = data;
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

function deleteValueField(e) {
    const id = e.target.id.split('-');

    if (id[0] === 'remove' && nextValueIndex > 3) {
        e.target.nextSibling.remove();
        e.target.nextSibling.remove();
        e.target.remove();

        nextValueIndex--;

        for (var i = parseInt(id[1]) + 1; i <= nextValueIndex; i++) {
            var removeButton = document.getElementById('remove-' + i);
            var addButton = document.getElementById('add-' + i);
            var value = document.getElementById('value-' + i);

            removeButton.id = 'remove-' + (i - 1);
            addButton.id = 'add-' + (i - 1);
            value.id = 'value-' + (i - 1);
        }
    }
}

function insertValueField(e) {

    // Insert -/+ butttons and value field immediately below the + button clicked

    const id = e.target.id.split('-');

    if (id[0] === 'add') {
        var newNode = e.target.parentNode.cloneNode(true);

        newNode.children[0].id = 'remove-' + nextValueIndex;
        newNode.children[1].id = 'add-' + nextValueIndex;
        newNode.children[2].id = 'value-' + nextValueIndex;
        newNode.children[2].value = '';

        valuesAreaDiv.appendChild(newNode);

        nextValueIndex++;

        for (var i = nextValueIndex - 2; i >= parseInt(id[1]) + 1; i--) {
            var removeButtonHi = document.getElementById('remove-' + i);
            var removeButtonLo = document.getElementById('remove-' + (i + 1));
            var addButtonHi = document.getElementById('add-' + i);
            var addButtonLo = document.getElementById('add-' + (i + 1));
            var valueHi = document.getElementById('value-' + i);
            var valueLo = document.getElementById('value-' + (i + 1));

            removeButtonLo.id = 'remove-' + (i + 1);
            addButtonLo.id = 'add-' + (i + 1);
            valueLo.id = 'value-' + (i + 1);

            valueLo.value = valueHi.value;
            valueHi.value = '';
        }
    }

    numberOfValuesInput.value = nextValueIndex;
}

function changeNumberOfValueFields() {
    const currentNumberOfFields = nextValueIndex;
    const newNumberOfFields = numberOfValuesInput.value;

    if (newNumberOfFields < 3) {
        numberOfValuesInput.value = 3;
    }

    if (newNumberOfFields > currentNumberOfFields) {
        for (var i = currentNumberOfFields - 1; i < newNumberOfFields - 1; i++) {
            document.getElementById('add-' + i).click();
        }
    }
    else if (newNumberOfFields < currentNumberOfFields) {
        for (var i = currentNumberOfFields - 1; i > newNumberOfFields - 1; i--) {
            document.getElementById('remove-' + i).click();
        }
    }
}

function nextField(e) {
    const id = e.target.id.split('-');

    if ((e.key === 'Enter' || e.key === 'NumpadEnter' || e.keyCode === 40) &&
        !e.shiftKey && id[0] === 'value') {

        // Enter or down arrow
        if (id[1] === '' + (nextValueIndex - 1)) {
            id[1] = 0;  // To top box
        } else {
            id[1]++;
        }

        const valueBox = document.getElementById('value-' + id[1]);
        valueBox.focus();
    } else if ((e.keyCode === 38 && id[0] === 'value') ||
        (e.key === 'Enter' || e.key === 'NumpadEnter') && e.shiftKey) {

        // Shift + enter or up arrow
        if (id[1] === '0') {
            id[1] = nextValueIndex - 1;  // To bottom box
        } else {
            id[1]--;
        }

        const valueBox = document.getElementById('value-' + id[1]);
        valueBox.focus();

        // Cursor to end of input
        setTimeout(function() { valueBox.selectionStart = valueBox.selectionEnd = 10000; }, 0 );
    }
}

function addNewValueField(count) {

    for (let n = nextValueIndex; n < nextValueIndex + count; n++) {

        var newDiv = document.createElement("div");
        var removeButton = createButton('remove-' + n, '-');
        var addButton = createButton('add-' + n, '+');
        var newValue = document.createElement("input");

        var removeButton = createButton('remove-' + n, '-');
        var addButton = createButton('add-' + n, '+');

        addButton.style.marginLeft = '0px';
        addButton.style.marginRight = '7px';

        newValue.type = 'text';
        newValue.id = 'value-' + n;
        newValue.style.width = '102px';

        newDiv.appendChild(removeButton);
        newDiv.appendChild(addButton);
        newDiv.appendChild(newValue);
        valuesAreaDiv.appendChild(newDiv);
    }

    valuesAreaDiv.addEventListener("click", deleteValueField);
    valuesAreaDiv.addEventListener("click", insertValueField);
    valuesAreaDiv.addEventListener("keydown", nextField);

    nextValueIndex += count;
}

function createButton(id, sign) {
    var newButton = document.createElement("button");

    newButton.id = id;
    newButton.style.width = '24px';
    newButton.style.height = '30px';
    newButton.textContent = sign;

    return newButton;
}

numberOfValuesInput.addEventListener("change", changeNumberOfValueFields);
generatePlotButton.addEventListener("click", generatePlot);
chartTypeSelect.addEventListener("change", changeOtherTypeVisibility);
copyToClipboardButton.addEventListener("click", copyToClipboard);
downloadChartButton.addEventListener("click", downloadChart);

numberOfValuesInput.style.width = '165px';
addNewValueField(5)
