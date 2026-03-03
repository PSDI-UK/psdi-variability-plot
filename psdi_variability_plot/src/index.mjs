// index.mjs

import ttest from '../node_modules/@stdlib/stats-ttest/lib/index.js';
import ztest from '../node_modules/@stdlib/stats-ztest/lib/index.js';
import stdev from '../node_modules/@stdlib/stats-base-stdev/lib/index.js';
import { saveAs } from 'file-saver';
import { Chart } from "./plot.js";
import { FormattedText } from './formattedText.js';

const numberOfValuesInput = document.querySelector("input#numValues");
const chartWidthInput = document.querySelector("input#chartWidth");
const chartHeightInput = document.querySelector("input#chartHeight");
const chartTypeSelect = document.querySelector("select#chartType");
const significanceInput = document.querySelector("select#significance");
const variabilityPlotContainer = document.querySelector("#variabilityPlotContainer");
const notificationsDiv = document.querySelector("div#notifications");
const otherTypeInput = document.querySelector("input#otherType");
const otherTypeRowDiv = document.querySelector("div#otherTypeRow");
const noChartDiv = document.querySelector("div#noChart");
const exampleDataButton = document.querySelector("button#exampleData");
const copyToClipboardButton = document.querySelector("button#copyToClipboard");
const downloadChartButton = document.querySelector("button#downloadChart");
const valuesAreaDiv = document.querySelector("div#valuesArea");
const copySuccess = document.querySelector("#copySuccess");
const copyFailure = document.querySelector("#copyFailure");
const variabilityChart = document.querySelector("#variabilityChart");
const plotDesignElement = document.querySelector("#plotDesign");
const compoundEditor = document.querySelector("div#compoundEditor");
const pointTypeSelect = document.querySelector("select#pointType");
const pointColorInput = document.querySelector("input#pointColor");
const pointSizeInput = document.querySelector("input#pointSize");
const pointWeightInput = document.querySelector("input#pointWeight");
const bandColorInput = document.querySelector("input#bandColor");
const meanColorInput = document.querySelector("input#meanColor");
const meanWeightInput = document.querySelector("input#meanWeight");
const titleFontSizeInput = document.querySelector("input#titleFontSize");
const axisFontSizeInput = document.querySelector("input#axisFontSize");
const tickfontSizeInput = document.querySelector("input#tickfontSize");
const yAxisIntervalSelect = document.querySelector("select#yAxisInterval");

var nextValueIndex = 0;
var manualEntry = false;
var tooltipList;

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

function resetAlerts() {
    notificationsDiv.replaceChildren();
}

function showAlert(type) {

    const alert = document.querySelector(`template#${type}`).content.cloneNode(true)

    notificationsDiv.append(alert)
}

const chartTypeLabel = {
    "isolatedYield": "Isolated yield",
    "spectroscopicYield": "Spectroscopic yield",
    "chromatographicYield": "Chromatographic yield",
    "ee": "ee",
    "de": "de",
    "other": "other"
}

const chartTypeLabelLoweCase = {
    "isolatedYield": "isolated yield",
    "spectroscopicYield": "spectroscopic yield",
    "chromatographicYield": "chromatographic yield",
    "ee": "ee",
    "de": "de",
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

function setValues(values) {

    numberOfValuesInput.value = values.length;

    changeNumberOfValueFields();

    for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
        document.getElementById(`value-${valueIndex}`).value = values[valueIndex];
    }
}

function fillWithExampleData() {
    if (!manualEntry ||
        confirm("Data currently entered in the form will be lost. Do you want to proceed?")) {
        const data = [56, 66, 45, 58, 59];

        numberOfValuesInput.value = 5;
        changeNumberOfValueFields();

        for (var i = 0; i < 5; i++) {
            document.getElementById("value-" + i).value = data[i];
        }

        chartTypeSelect.options[1].selected = true;
        compoundEditorObject.setFormattedContent('Example <b>product</b>');
        manualEntry = false;

        updateMain();
    }
}

function validatePlot() {

    const chartType = chartTypeSelect.value;
    const otherDef = otherTypeInput.value;
    const compound = compoundEditorObject.getTextContent();

    const values = getValues();

    const needThreeValues = (values === null) || (values.length < 3);
    const needReactionOutcome = chartType === "noSelection";
    const needOtherOutcome = (chartType === "other") && (otherDef === "");
    const needProductLabel = compound === "";

    return {
        validated: !(needThreeValues || needReactionOutcome || needOtherOutcome || needProductLabel),
        needThreeValues,
        needReactionOutcome,
        needOtherOutcome,
        needProductLabel
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

async function loadImage(src) {

    const img = document.createElement("img");

    img.src = src;

    return new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

async function convertSVGToDataURL(svgElement, format, quality) {

    const xmlSerializer = new XMLSerializer();
    const svgXML = xmlSerializer.serializeToString(svgElement);
    const svgDataURL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXML)}`;

    const svgImage = await loadImage(svgDataURL);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = svgImage.naturalWidth;
    canvas.height = svgImage.naturalHeight;
    context.drawImage(svgImage, 0, 0, svgImage.naturalWidth, svgImage.naturalHeight);

    return canvas.toDataURL(`image/${format}`, quality);
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

async function prepareBitmapCopy() {

    const blob = await getExportBlob("png");

    // Create ClipboardItem with blob and its type, and add to an array

    copyToClipboardButton.data = [new ClipboardItem({ [blob.type]: blob })];
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

        updateMain();
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

        newNode.querySelector("input").addEventListener("change", () => {
            updateMain();
            manualEntry = true;
        });

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
        setTimeout(function () { valueBox.selectionStart = valueBox.selectionEnd = 10000; }, 0);
    }
}

function addNewValueField(count) {

    for (let n = nextValueIndex; n < nextValueIndex + count; n++) {

        var newDiv = document.createElement("div");
        var removeButton = createButton('remove-' + n, '-');
        var addButton = createButton('add-' + n, '+');
        var newValue = document.createElement("input");

        //        var removeButton = createButton('remove-' + n, '-');
        //      var addButton = createButton('add-' + n, '+');

        addButton.style.marginLeft = '0px';
        addButton.style.marginRight = '7px';

        newValue.type = 'text';
        newValue.id = 'value-' + n;
        newValue.style.width = '102px';

        newValue.addEventListener("change", () => {
            updateMain();
            manualEntry = true;
        });

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

const compoundEditorObject = new FormattedText({
    element: compoundEditor,
    changeFunc: function () {
        renderChart(variabilityChart);
    }
});

function updateDesign() {
    renderChart(plotDesignElement);
}

function updateMain() {
    renderChart(variabilityChart);
}

function setupChangeEvents() {

    chartWidthInput.addEventListener("change", updateMain);
    chartHeightInput.addEventListener("change", updateMain);
    chartTypeSelect.addEventListener("change", updateMain);
    otherTypeInput.addEventListener("input", updateMain);
    significanceInput.addEventListener("input", updateMain);

    titleFontSizeInput.addEventListener("input", updateDesign);
    pointTypeSelect.addEventListener("change", updateDesign);
    pointColorInput.addEventListener("change", updateDesign);
    pointWeightInput.addEventListener("change", updateDesign);
    pointSizeInput.addEventListener("change", updateDesign);
    bandColorInput.addEventListener("change", updateDesign);
    meanColorInput.addEventListener("change", updateDesign);
    meanWeightInput.addEventListener("change", updateDesign);
    axisFontSizeInput.addEventListener("input", updateDesign);
    tickfontSizeInput.addEventListener("input", updateDesign);
    yAxisIntervalSelect.addEventListener("input", updateDesign);
}

function getProjectData() {

    return {

        type: "variabilityPlotProject",
        version: 1,

        values: getValues(),
        chartType: chartTypeSelect.value,
        chartWidth: parseInt(chartWidthInput.value),
        chartHeight: parseInt(chartHeightInput.value),
        pointType: pointTypeSelect.value,
        pointColor: pointColorInput.value,
        pointWeight: parseInt(pointWeightInput.value),
        pointSize: parseInt(pointSizeInput.value),
        bandColor: bandColorInput.value,
        meanColor: meanColorInput.value,
        meanWeight: meanWeightInput.value,
        titleFontSize: parseInt(titleFontSizeInput.value),
        axisFontSize: parseInt(axisFontSizeInput.value),
        tickfontSize: parseInt(tickfontSizeInput.value),
        compound: compoundEditorObject.getFormattedContent(),
        yAxisInterval: yAxisIntervalSelect.value === "auto" ? "auto" : parseInt(yAxisIntervalSelect.value),
    };
}

function setProjectData(data) {

    if (data.values) {
        setValues(data.values);
    }

    if (data.chartType) {
        chartTypeSelect.value = data.chartType;
    }

    if (data.width) {
        chartWidthInput.value = data.width;
    }

    if (data.height) {
        chartHeightInput.value = data.height;
    }

    if (data.pointType) {
        pointTypeSelect.value = data.pointType;
    }

    if (data.pointColor) {
        pointColorInput.value = data.pointColor;
    }

    if (data.pointWeight) {
        pointWeightInput.value = data.pointWeight;
    }

    if (data.pointSize) {
        pointSizeInput.value = data.pointSize;
    }

    if (data.bandColor) {
        bandColorInput.value = data.bandColor;
    }

    if (data.meanColor) {
        meanColorInput.value = data.meanColor;
    }

    if (data.meanWeight) {
        meanWeightInput.value = data.meanWeight;
    }

    if (data.titleFontSize) {
        titleFontSizeInput.value = data.titleFontSize;
    }

    if (data.axisFontSize) {
        axisFontSizeInput.value = data.axisFontSize;
    }

    if (data.tickfontSize) {
        tickfontSizeInput.value = data.tickfontSize;
    }

    if (data.compound) {
        compoundEditorObject.setFormattedContent(data.compound);
    }

    if (data.yAxisInterval) {
        yAxisIntervalSelect.value = data.yAxisInterval;
    }
}

function saveProject() {

    const data = getProjectData();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "text/plain;charset=utf-8" });

    saveAs(blob, "variability.json");
}

function loadProject() {
    document.querySelector("input#loadProjectFile").click();
}

async function getExportBlob(format) {

    const svg = variabilityChart.querySelector(":scope > svg");

    let blob;

    if (format === "svg") {

        // Embed font.

        // const fontRequest = await fetch("fonts/OpenSans-Regular.ttf");

        // const base64 = (new Uint8Array(await fontRequest.bytes())).toBase64();

        // const dataURL = `data:image/svg+xml;charset=utf-8;base64,${base64}`;

        blob = new Blob([svg.outerHTML], { type: "image/svg+xml; charset=utf-8" });

    } else if ((format === "png") || (format == "jpeg")) {

        const dataURL = await convertSVGToDataURL(svg, format, 1);
        const response = await fetch(dataURL);

        blob = await response.blob();

    } else {

        throw "Unknown export type";
    }

    return blob;
}

async function downloadChart() {

    const format = document.querySelector("select#downloadFormat").value;

    saveAs(await getExportBlob(format), `variability.${format}`);
}

async function loadProjectFile(event) {

    const files = event.srcElement.files;

    if (files.length > 0) {

        let data;

        try {

            data = JSON.parse(await files[0].text());

            if (data.type !== "variabilityPlotProject") {
                throw new Error("Incorrect type");
            }


        } catch {

            alert("File does not appear to be a variability plot project");
            return;
        }

        setProjectData(data);

        renderChart(variabilityChart);
    }
}

function renderChartAux(element) {

    const projectData = getProjectData();

    const significance = parseFloat(significanceInput.value);

    const values = getValues();

    const results = calculateVariabilityData(values, 1 - (significance / 100));

    const mean = values.reduce((acc, current) => acc + current, 0.0) / values.length;

    let otherTypeText = otherTypeInput.value.trim();
    otherTypeText = otherTypeText.replace('(%)', '').trim();
    otherTypeText = otherTypeText.replace('%', '').trim();

    const chartType = chartTypeSelect.value;
    const compound = compoundEditorObject.getFormattedContent();
    const chartTypeText = chartType !== "other" ? chartTypeLabelLoweCase[chartType] : otherTypeText;
    const yLabel = `${capitalise(chartTypeText)} of ${compound} (%)`;

    const xLabelEditorObject = new FormattedText({});
    const autoTitleEditorObject = new FormattedText({});
    const yLabelEditorObject = new FormattedText({});

    xLabelEditorObject.setFormattedContent("Iterations");
    autoTitleEditorObject.setFormattedContent(`Variability plot for the ${chartTypeText} of ${compound}`);
    yLabelEditorObject.setFormattedContent(yLabel);

    const lowerConfidenceBound = Math.round(results.ci[0]);
    const upperConfidenceBound = Math.round(results.ci[1]);

    const legendText1 = `Mean yield = ${Math.round(mean)}%`;
    const legendText2 =
        `${significance}% Confidence interval: ${lowerConfidenceBound}% to ${upperConfidenceBound}%`;

    let data = [];

    for (let sampleIndex = 0; sampleIndex < values.length; sampleIndex++) {

        data.push({
            x: sampleIndex + 1,
            y: values[sampleIndex]
        });
    }

    new Chart({
        data,
        targetElement: element,
        meanValue: results.mean,
        confidenceUpperLimit: results.ci[1],
        confidenceLowerLimit: results.ci[0],
        legendLines: [legendText1, legendText2],
        width: projectData.chartWidth,
        height: projectData.chartHeight,
        pointType: projectData.pointType,
        pointColor: projectData.pointColor,
        pointWeight: projectData.pointWeight,
        pointSize: projectData.pointSize,
        bandColor: projectData.bandColor,
        meanColor: projectData.meanColor,
        meanWeight: projectData.meanWeight,
        title: autoTitleEditorObject,
        xLabel: xLabelEditorObject,
        yLabel: yLabelEditorObject,
        titleFontSize: projectData.titleFontSize,
        axisFontSize: projectData.axisFontSize,
        tickfontSize: projectData.tickfontSize,
        yTickStep: projectData.yAxisInterval ? projectData.yAxisInterval : "auto",
    });
}

let loadedFonts = false;

function showNoChartMessage(enable) {

    if (enable) {

        variabilityPlotContainer.hidden = true;

        noChartDiv.hidden = false;
        noChartDiv.style.display = "flex";

    } else {

        variabilityPlotContainer.hidden = false;

        noChartDiv.hidden = true;
        noChartDiv.style.display = "none";
    }
}

function statusLine(text) {

    const element = document.createElement("div");

    element.textContent = text;

    return element;
}

async function renderChart(element) {

    const validationResult = validatePlot();

    if (validationResult.validated) {

        // Ensure that fonts are loaded before rendering.

        if (!loadedFonts) {

            noChartDiv.replaceChildren(statusLine("loading fonts"));
            showNoChartMessage(true);

            const font = new FontFace("OpenSans", 'url("static/fonts/OpenSans-Regular.ttf")');
            document.fonts.add(font);
            font.load();

            await document.fonts.ready;

            loadedFonts = true;
        }

        showNoChartMessage(false);

        renderChartAux(element);

        await prepareBitmapCopy()

    } else {

        let statusLines = [];

        if (validationResult.needThreeValues) {
            statusLines.push(statusLine("enter at least three reaction outcome values"));
        }

        if (validationResult.needReactionOutcome) {
            statusLines.push(statusLine("select a reaction outcome"));
        }

        if (validationResult.needOtherOutcome) {
            statusLines.push(statusLine("enter a definition of 'Other'"));
        }

        if (validationResult.needProductLabel) {
            statusLines.push(statusLine("enter a product label"));
        }

        noChartDiv.replaceChildren(...statusLines);

        showNoChartMessage(true);
    }
}

function showVariabilityPlotDesign() {

    variabilityPlotDialog.showModal();

    renderChart(plotDesignElement);

}

function hideVariabilityPlotDesign() {
    variabilityPlotDialog.close();
    renderChart(variabilityChart);
}

/**
 * Enable all tooltips on the page
 */
function initTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

$(document).ready(function () {
    initTooltips();
});

numberOfValuesInput.addEventListener("change", changeNumberOfValueFields);
exampleDataButton.addEventListener("click", fillWithExampleData);
chartTypeSelect.addEventListener("change", changeOtherTypeVisibility);
copyToClipboardButton.addEventListener("click", copyToClipboard);
downloadChartButton.addEventListener("click", downloadChart);

numberOfValuesInput.style.width = '165px';
addNewValueField(5)
setupChangeEvents();

customiseChart.addEventListener("click", showVariabilityPlotDesign);

closeVariabilityPlotDialog.addEventListener("click", hideVariabilityPlotDesign);

document.querySelector("button#saveProject").addEventListener("click", saveProject);
document.querySelector("button#loadProject").addEventListener("click", loadProject);
document.querySelector("button#downloadChart").addEventListener("click", downloadChart);
document.querySelector("input#loadProjectFile").addEventListener("change", loadProjectFile);

renderChart(variabilityChart);
