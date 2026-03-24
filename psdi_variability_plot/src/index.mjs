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
const otherEditor = document.querySelector("div#otherEditor");
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
const outsideRangeWarning = document.querySelector("#outsideRangeWarning");
const boxFontSizeInput = document.querySelector("input#boxFontSize");
const boxPositionSelect = document.querySelector("select#boxPosition");
const boxBorderColorInput = document.querySelector("input#boxBorderColor");
const boxBackgroundColorInput = document.querySelector("input#boxBackgroundColor");
const boxOpacityInput = document.querySelector("input#boxOpacity");
const boxLeftInput = document.querySelector("input#boxLeft");
const boxTopInput = document.querySelector("input#boxTop");
const boxCoordinatesContainer = document.querySelector(".boxCoordinatesContainer");
const devicePixelRatioSelect = document.querySelector("select#devicePixelRatio");
const formatSelect = document.querySelector("select#downloadFormat");
const fileNameInput = document.querySelector("input#fileName");

var nextValueIndex = 0;
var manualEntry = false;
var tooltipList;
var reversionData;
var lastSavedData;
var exampleData;
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

const chartTypeLabelLowerCase = {
    "isolatedYield": "isolated yield",
    "spectroscopicYield": "spectroscopic yield",
    "chromatographicYield": "chromatographic yield",
    "ee": "<i>ee</i>",
    "de": "<i>de</i>",
    "other": "other"
}

function capitalise(text) {

    const match = text.match(/^(\s*)(\w)(.*)$/);

    if (match) {

        if (match[2].match(/[^de]/)) {
            match[2] = match[2].toUpperCase();
            return match.slice(1, 4).join("");
        } else {
            return match[2] + "e";
        }

    } else {

        return text;
    }
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
        changeOtherTypeVisibility();
    }

    // Clear the tooltip from hovering over the button, since clicking it focuses it and will keep the tooltip present,
    // which is surprising for mouse users. This needs to happen after a brief delay in case the alert pops up, which
    // briefly borrows focus before reverting to the button
    setTimeout(clearTooltips, 100);
}

function validatePlot() {

    const chartType = chartTypeSelect.value;
    const otherDef = otherEditorObject.getTextContent();
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

    if (chartTypeSelect.value === "other") {
        highlightElement(otherTypeRowDiv);
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

    const devicePixelRatio = devicePixelRatioSelect.value;

    const xmlSerializer = new XMLSerializer();
    const svgXML = xmlSerializer.serializeToString(svgElement);
    const svgDataURL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXML)}`;

    const svgImage = await loadImage(svgDataURL);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const canvasWidth = svgImage.naturalWidth * devicePixelRatio;
    const canvasHeight = svgImage.naturalHeight * devicePixelRatio;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    context.drawImage(svgImage, 0, 0, canvasWidth, canvasHeight);

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

const otherEditorObject = new FormattedText({
    element: otherEditor,
    changeFunc: function () {
        renderChart(variabilityChart);
    }
});

const formattedOutcome = new FormattedText({});

function updateDesign() {
    renderChart(plotDesignElement, { isDesign: true });
}

function updateMain() {
    renderChart(variabilityChart);
}

function setupChangeEvents() {

    chartWidthInput.addEventListener("change", updateMain);
    chartHeightInput.addEventListener("change", updateMain);
    chartTypeSelect.addEventListener("change", updateMain);
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
    boxFontSizeInput.addEventListener("change", updateDesign);
    boxPositionSelect.addEventListener("change", updateDesign);
    boxBorderColorInput.addEventListener("change", updateDesign);
    boxBackgroundColorInput.addEventListener("change", updateDesign);
    boxOpacityInput.addEventListener("change", updateDesign);
    boxLeftInput.addEventListener("change", updateDesign);
    boxTopInput.addEventListener("change", updateDesign);
}

function getProjectData() {

    return {

        type: "variabilityPlotProject",
        version: 1,

        filename: fileNameInput.value,
        values: getValues(),
        chartType: chartTypeSelect.value,
        otherDef: otherEditorObject.getTextContent(),
        chartWidth: parseInt(chartWidthInput.value),
        chartHeight: parseInt(chartHeightInput.value),
        devicePixelRatio: devicePixelRatioSelect.value,
        format: formatSelect.value,
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
        significance: significanceInput.value,
        yAxisInterval: yAxisIntervalSelect.value === "auto" ? "auto" : parseInt(yAxisIntervalSelect.value),
        boxFontSize: parseInt(boxFontSizeInput.value),
        boxPosition: boxPositionSelect.value,
        boxBorderColor: boxBorderColorInput.value,
        boxBackgroundColor: boxBackgroundColorInput.value,
        boxOpacity: parseFloat(boxOpacityInput.value),
        boxLeft: parseInt(boxLeftInput.value),
        boxTop: parseInt(boxTopInput.value)
    };
}

function setProjectData(data) {

    if (data.filename) {
        fileNameInput.value = data.filename;
    }

    if (data.values) {
        setValues(data.values);
    }

    if (data.chartType) {
        chartTypeSelect.value = data.chartType;
    }

    if (data.otherDef) {
        otherEditorObject.setFormattedContent(data.otherDef);
        otherTypeRowDiv.hidden = data.otherDef === "";
    }

    if (data.width) {
        chartWidthInput.value = data.width;
    }

    if (data.height) {
        chartHeightInput.value = data.height;
    }

    if (data.devicePixelRatio) {
        devicePixelRatioSelect.value = data.devicePixelRatio;
    }

    if (data.format) {
        formatSelect.value = data.format;
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

    if (data.significance) {
        significanceInput.value = data.significance;
    }

    if (data.yAxisInterval) {
        yAxisIntervalSelect.value = data.yAxisInterval;
    }

    if (data.boxFontSize) {
        boxFontSizeInput.value = data.boxFontSize;
    }

    if (data.boxPosition) {
        boxPositionSelect.value = data.boxPosition;
    }

    if (data.boxBorderColor) {
        boxBorderColorInput.value = data.boxBorderColor;
    }

    if (data.boxBackgroundColor) {
        boxBackgroundColorInput.value = data.boxBackgroundColor;
    }

    if (data.boxOpacity) {
        boxOpacityInput.value = data.boxOpacity;
    }

    if (data.boxLeft) {
        boxLeftInput.value = data.boxLeft;
    }

    if (data.boxTop) {
        boxTopInput.value = data.boxTop;
    }
}

function saveProject() {

    const data = getProjectData();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "text/plain;charset=utf-8" });

    var filename = fileNameInput.value;

    filename = (filename === "") ? "variability.json" : filename + ".json";

    saveAs(blob, filename);

    lastSavedData = structuredClone(data);
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

    const format = formatSelect.value;

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

        lastSavedData = structuredClone(getProjectData());
    }
}

function replaceTextInElement(element, match, replace) {

    for (const node of element.childNodes) {

        if (node.nodeType === 3) {

            node.textContent = node.textContent.replace(match, replace);

        } else if (node.nodeType === 1) {

            replaceTextInElement(node, match, replace);

        }
    }
}

function capitaliseTextInElement(element, match, replace) {

    for (const node of element.childNodes) {

        if (node.nodeType === 3) {

            if (node.textContent.match(/\w/)) {

                node.textContent = capitalise(node.textContent);
                return true;
            }

        } else if (node.nodeType === 1) {

            if (capitaliseTextInElement(node, match, replace)) {
                return true;
            }
        }
    }
}

function enableBoxDrag(chart, element) {

    const boxElement = element.querySelector("g.box");
    const plotBackground = element.querySelector("rect.plotBackground");

    const plotAreaX = parseInt(plotBackground.getAttribute("x"));
    const plotAreaY = parseInt(plotBackground.getAttribute("y"));

    boxElement.style.cursor = "move";
    boxElement.style.userSelect = "none";
    boxElement.style.touchAction = "none";

    let initialClientX;
    let initialClientY;

    let initialTransformX;
    let initialTransformY;

    function handleEvent(event) {

        if (event.type === "pointerdown") {

            boxPositionSelect.value = "manual";

            initialClientX = event.clientX;
            initialClientY = event.clientY;

            const transform = boxElement.getAttribute("transform");
            const match = transform.match(/translate\((\d+(\.\d+)?), (\d+(\.\d+)?)\)/);

            initialTransformX = parseInt(match[1]) - plotAreaX;
            initialTransformY = parseInt(match[3]) - plotAreaY;

            boxElement.setPointerCapture(event.pointerId);

        } else if (event.type === "pointermove") {

            if (boxElement.hasPointerCapture(event.pointerId)) {

                const newTransformX = initialTransformX + event.clientX - initialClientX;
                const newTransformY = initialTransformY + event.clientY - initialClientY;

                const { manualBoxLeft, manualBoxTop } = chart.calculateBoxPosition({
                    boxLeft: newTransformX,
                    boxTop: newTransformY
                });

                boxLeftInput.value = manualBoxLeft;
                boxTopInput.value = manualBoxTop;

                chart.setBoxPosition({ boxLeft: manualBoxLeft + plotAreaX, boxTop: manualBoxTop + plotAreaY });
            }

        } else if (event.type === "pointerup") {

            boxElement.releasePointerCapture(event.pointerId);
        }
    }

    boxElement.addEventListener("pointerdown", handleEvent);
    boxElement.addEventListener("pointermove", handleEvent);
    boxElement.addEventListener("pointerup", handleEvent);
}

function renderChartAux(element, { isDesign }) {

    const projectData = getProjectData();

    const significance = parseFloat(significanceInput.value);

    const values = getValues();

    const results = calculateVariabilityData(values, 1 - (significance / 100));

    const mean = values.reduce((acc, current) => acc + current, 0.0) / values.length;

    const compound = compoundEditorObject.getFormattedContent();

    const chartType = chartTypeSelect.value;

    const chartTypeElement = document.createElement("span");

    if (chartType === "other") {

        chartTypeElement.innerHTML = otherEditorObject.getFormattedContent().toLowerCase();

        replaceTextInElement(chartTypeElement, '(%)', '');
        replaceTextInElement(chartTypeElement, '%', '');

    } else {

        formattedOutcome.setFormattedContent(chartTypeLabelLowerCase[chartType]);
        chartTypeElement.innerHTML = formattedOutcome.getFormattedContent();
    }

    const capitalisedTChartTypeElement = chartTypeElement.cloneNode(true);

    capitaliseTextInElement(capitalisedTChartTypeElement);

    const yLabel = `${capitalisedTChartTypeElement.innerHTML} of ${compound} (%)`;

    const xLabelEditorObject = new FormattedText({});
    const autoTitleEditorObject = new FormattedText({});
    const yLabelEditorObject = new FormattedText({});
    const warningTextObject = new FormattedText({});

    xLabelEditorObject.setFormattedContent("Iterations");
    autoTitleEditorObject.setFormattedContent(`Variability plot for the ${chartTypeElement.innerHTML} of ${compound}`);
    yLabelEditorObject.setFormattedContent(yLabel);

    let lowerConfidenceBound = Math.round(results.ci[0]);
    let upperConfidenceBound = Math.round(results.ci[1]);

    const showWarningText = (lowerConfidenceBound < 0) || (upperConfidenceBound > 100);

    if (lowerConfidenceBound < 0) {
        lowerConfidenceBound = 0;
    }

    if (upperConfidenceBound > 100) {
        upperConfidenceBound = 100;
    }

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

    outsideRangeWarning.hidden = !showWarningText;

    if (showWarningText) {

        for (const element of document.querySelectorAll(".outsideWarningSignificance")) {
            element.textContent = significance;
        }

        warningTextObject.setFormattedContent(`The ${significance}% CI extends outside the range 0-100% and has been restricted to these limits`);
    }

    const chart = new Chart({
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
        tickFontSize: projectData.tickfontSize,
        yTickStep: projectData.yAxisInterval ? projectData.yAxisInterval : "auto",
        showWarningText,
        warningText: warningTextObject,
        elementSpacing: 4,
        tickAreaSize: 12,
        titleGap: 18,
        boxFontSize: projectData.boxFontSize,
        boxPosition: projectData.boxPosition,
        boxBorderColor: projectData.boxBorderColor,
        boxBackgroundColor: projectData.boxBackgroundColor,
        boxOpacity: projectData.boxOpacity,
        boxLeft: projectData.boxLeft,
        boxTop: projectData.boxTop,
        isDesign,
    });

    if (isDesign) {
        enableBoxDrag(chart, element);
    }
}

// let loadedFonts = false;

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

async function renderChart(element, opts = {}) {

    const validationResult = validatePlot();

    if (validationResult.validated) {

        // Ensure that fonts are loaded before rendering.

        // if (!loadedFonts) {

        //     noChartDiv.replaceChildren(statusLine("loading fonts"));
        //     showNoChartMessage(true);

        //     const font = new FontFace("OpenSans", 'url("static/fonts/OpenSans-Regular.ttf")');
        //     document.fonts.add(font);
        //     font.load();

        //     await document.fonts.ready;

        //     loadedFonts = true;
        // }

        showNoChartMessage(false);

        renderChartAux(element, { isDesign: !!opts.isDesign });

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
    reversionData = getProjectData()
    variabilityPlotDialog.showModal();
    renderChart(plotDesignElement, { isDesign: true });

    updateDesignOptions();
}

function hideVariabilityPlotDesign() {
    variabilityPlotDialog.close("accept");
}

function cancelVariabilityPlotDesign() {
    variabilityPlotDialog.close("cancel");
}

function variabilityPlotDesignClosed() {

    if (variabilityPlotDialog.returnValue !== "accept") {
        setProjectData(reversionData);
    }

    renderChart(variabilityChart);
}

/**
 * Enable all tooltips on the page
 */
function initTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

/**
 * Clear any tooltips currently present on the page
 */
function clearTooltips() {
    tooltipList.forEach((tooltip) => {
        tooltip.hide();
    });
}

$(document).ready(function () {
    initTooltips();

    lastSavedData = structuredClone(getProjectData());

    exampleData = structuredClone(getProjectData());
    exampleData.chartType = "isolatedYield";
    exampleData.values = [56, 66, 45, 58, 59];
    exampleData.compound = "Example&nbsp;<b>product</b>";
});

window.addEventListener("beforeunload", function (event) {
    // Give a warning if trying to leave the page and data has changed 
    if ((JSON.stringify(getProjectData()) !== JSON.stringify(lastSavedData)) &&
        (JSON.stringify(getProjectData()) !== JSON.stringify(exampleData))) {
        event.preventDefault();
        event.returnValue = true;
    }
});

numberOfValuesInput.addEventListener("change", changeNumberOfValueFields);
exampleDataButton.addEventListener("click", fillWithExampleData);
chartTypeSelect.addEventListener("change", changeOtherTypeVisibility);
copyToClipboardButton.addEventListener("click", copyToClipboard);
downloadChartButton.addEventListener("click", downloadChart);

const shouldShowBoxCoordinates = () => boxPositionSelect.value === "manual";

function updateDesignOptions() {
    boxCoordinatesContainer.hidden = !shouldShowBoxCoordinates();
}

function highlightElement(element) {

    element.animate([
        { "outline": "4px solid #ee4", "background": "#ee4" },
        { "outline": "4px solid #ee4", "background": "#ee4" }
    ], {
        "duration": 1500,
        iterations: 1
    });
}

boxPositionSelect.addEventListener("change", function (event) {

    updateDesignOptions();

    if (shouldShowBoxCoordinates()) {
        highlightElement(boxCoordinatesContainer);
    }
});

numberOfValuesInput.style.width = '165px';
addNewValueField(5)
setupChangeEvents();

customiseChart.addEventListener("click", showVariabilityPlotDesign);

closeVariabilityPlotDialog.addEventListener("click", hideVariabilityPlotDesign);
variabilityPlotDialog.addEventListener("close", variabilityPlotDesignClosed);
cancelVariabilityPlotDialogEntries.addEventListener("click", cancelVariabilityPlotDesign);

document.querySelector("button#saveProject").addEventListener("click", saveProject);
document.querySelector("button#loadProject").addEventListener("click", loadProject);
document.querySelector("button#downloadChart").addEventListener("click", downloadChart);
document.querySelector("input#loadProjectFile").addEventListener("change", loadProjectFile);

renderChart(variabilityChart);
