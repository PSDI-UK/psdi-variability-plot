// plot.js

import { FormattedText } from './formattedText.js';

class CartesianScale {

    #chart;

    #config;

    // Minimum data value.
    #min;

    // Maximum data value.
    #max;

    // SVG element offset where the plot area starts.
    #plotStart;

    // SVG element offset where the plot area ends.
    #plotEnd;

    #specifiedMin;
    #specifiedMax;
    #vertical;

    #minTickGap = 50;

    #minorGridStep;
    #tickStep;
    #labelStep;
    #tickFontSize;

    boxWidth;
    boxHeight;

    constructor(opts) {

        this.#chart = opts.chart;
        this.#config = opts.scaleConfig;
        this.#plotStart = opts.plotStart;
        this.#plotEnd = opts.plotEnd;
        this.#specifiedMin = opts.min;
        this.#specifiedMax = opts.max;
        this.#vertical = opts.vertical;
        this.#tickFontSize = opts.tickFontSize;

        if (opts.minTickGap) {
            this.#minTickGap = opts.minTickGap;
        }

        this.setData(opts.data);
    }

    setData(data) {
        this.#min = this.#specifiedMin !== undefined ? this.#specifiedMin : Math.min(...data);
        this.#max = this.#specifiedMax !== undefined ? this.#specifiedMax : Math.max(...data);
    }

    #minDiv(step) {
        return Math.ceil(this.#min / step);
    }

    #maxDiv(step) {
        return Math.floor(this.#max / step);
    }

    #getDivs(step) {

        const minDiv = this.#minDiv(step);
        const maxDiv = this.#maxDiv(step);

        let result = [];

        for (let divider = minDiv; divider <= maxDiv; divider++) {
            result.push(divider * step);
        }

        return result;
    }

    pos(value) {

        let start = this.#vertical ? this.#max : this.#min;
        let end = this.#vertical ? this.#min : this.#max;

        return this.#plotStart +
            ((start - value) / (start - end)) * (this.#plotEnd - this.#plotStart);
    }

    renderGridlines(element) {

        for (const value of this.#getDivs(this.#minorGridStep)) {

            if (this.#vertical) {

                element.append(this.#chart.createSVGElement("line", {
                    class: "gridLine",
                    x1: this.#chart.chart.plotArea.left,
                    y1: this.pos(value),
                    x2: this.#chart.chart.plotArea.right,
                    y2: this.pos(value)
                }));

            } else {

                element.append(this.#chart.createSVGElement("line", {
                    class: "gridLine",
                    x1: this.pos(value),
                    y1: this.#chart.chart.plotArea.top,
                    x2: this.pos(value),
                    y2: this.#chart.chart.plotArea.bottom
                }));
            }
        }
    }

    renderTickMarks(element) {

        for (const value of this.#getDivs(this.#tickStep)) {

            if (this.#vertical) {

                element.append(this.#chart.createSVGElement("line", {
                    class: "tickMark",
                    x1: this.#chart.chart.plotArea.left,
                    y1: this.pos(value),
                    x2: this.#chart.chart.plotArea.left - this.#config.tickSize,
                    y2: this.pos(value)
                }));

            } else {

                element.append(this.#chart.createSVGElement("line", {
                    class: "tickMark",
                    x1: this.pos(value),
                    y1: this.#chart.chart.plotArea.bottom,
                    x2: this.pos(value),
                    y2: this.#chart.chart.plotArea.bottom + this.#config.tickSize,
                }));
            }
        }
    }

    #generateTickLabels() {

        let lables = [];

        for (const value of this.#getDivs(this.#labelStep)) {

            const labelText = value.toString();

            let textElement;

            if (this.#vertical) {

                textElement = this.#chart.createSVGElement("text", {
                    class: "yTickLabel",
                    "font-size": this.#tickFontSize,
                    x: this.#chart.chart.y.tickLabelPosition,
                    y: this.pos(value),
                });

            } else {

                textElement = this.#chart.createSVGElement("text", {
                    class: "xTickLabel",
                    "font-size": this.#tickFontSize,
                    x: this.pos(value),
                    y: this.#chart.chart.x.tickLabelPosition,
                });
            }

            textElement.textContent = labelText;

            lables.push(textElement);
        }

        return lables;
    }

    renderTickLabels(element) {
        element.append(...this.#generateTickLabels());
    }

    maxTickLabelSize() {

        const svg = this.#chart.createSVGElement("svg");

        svg.style.position = "absolute";
        svg.style.left = "0";
        svg.style.top = "0";
        svg.style.opacity = 0

        const labels = this.#generateTickLabels();

        svg.append(...labels);

        document.body.insertAdjacentElement("afterbegin", svg);

        const bBoxes = labels.map(label => label.getBBox());

        const maxWidth = Math.max(...bBoxes.map(box => box.width));
        const maxHeight = Math.max(...bBoxes.map(box => box.height));

        svg.remove();

        return { maxWidth, maxHeight };
    }

    maxIntegerDigits(number) { returnMath.floor(Math.abs(number)).toString().length; }

    *stepFunction(minScale, maxScale) {

        let scale = minScale;

        while (scale <= maxScale) {

            yield (scale);
            yield (scale * 2);
            yield (scale * 5);

            scale = scale * 10;
        }
    }

    findIdealStep(minGap) {

        const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

        let result = 1;

        for (const step of steps) {

            const gap = Math.abs(this.pos(step) - this.pos(0));

            if (gap < minGap) {
                continue;
            }

            return step;
        }
    }

    calculateSteps() {

        this.#minorGridStep = this.#config.minorGridStep;
        this.#tickStep = this.#config.tickStep;
        this.#labelStep = this.#config.labelStep;

        if ((this.#minorGridStep === undefined) || (this.#minorGridStep === "auto")) {
            this.#minorGridStep = this.findIdealStep(this.#minTickGap);
        }

        if ((this.#tickStep === undefined) || (this.#tickStep === "auto")) {
            this.#tickStep = this.findIdealStep(this.#minTickGap);
        }

        if ((this.#labelStep === undefined) || (this.#labelStep === "auto")) {
            this.#labelStep = this.findIdealStep(this.#minTickGap);
        }
    }
}

export class Chart {

    // Copy of the dataset.
    #data;

    // Chart configuration.
    chart;

    // Target element to contain the SVG element.
    #targetElement;

    #meanValue;
    #confidenceUpperLimit;
    #confidenceLowerLimit;

    #width;
    #height;
    #pointType;
    #pointColor;
    #pointWeight;
    #pointSize;
    #bandColor;
    #meanColor;
    #meanWeight;
    #title;
    #xLabel;
    #yLabel;
    #titleFontFamily = "Arial, sans-serif";
    #titleFontSize;
    #axisFontFamily = "Arial, sans-serif";
    #axisFontSize;
    #tickFontFamily = "Arial, sans-serif";
    #tickFontSize;
    #boxFontFamily = "Arial, sans-serif";
    #boxFontSize;
    #yTickStep;
    #showWarningText;
    #warningText;
    #elementSpacing;
    #tickAreaSize;
    #titleGap;
    #boxPosition;
    #boxBorderColor;
    #boxBackgroundColor;
    #boxOpacity;
    #boxLeft;
    #boxTop;
    #isDesign;
    #boxElement;

    #legendLines;

    constructor({ targetElement, width, height, pointType, pointColor, pointWeight, pointSize,
        bandColor, meanColor, meanWeight, title, xLabel, yLabel, titleFontSize, axisFontSize, tickFontSize,
        data, meanValue, confidenceUpperLimit, confidenceLowerLimit, legendLines, yTickStep,
        showWarningText, warningText, elementSpacing, tickAreaSize, titleGap,
        boxFontSize, boxPosition, boxBorderColor, boxBackgroundColor, boxOpacity,
        boxLeft, boxTop, isDesign }) {

        this.#targetElement = targetElement;
        this.#data = data;
        this.#meanValue = meanValue;
        this.#confidenceUpperLimit = confidenceUpperLimit;
        this.#confidenceLowerLimit = confidenceLowerLimit;
        this.#width = width;
        this.#height = height;
        this.#pointType = pointType;
        this.#pointColor = pointColor;
        this.#pointWeight = pointWeight;
        this.#pointSize = pointSize;
        this.#bandColor = bandColor;
        this.#meanColor = meanColor;
        this.#meanWeight = meanWeight;
        this.#title = title;
        this.#xLabel = xLabel;
        this.#yLabel = yLabel;
        this.#titleFontSize = titleFontSize;
        this.#axisFontSize = axisFontSize;
        this.#tickFontSize = tickFontSize;
        this.#legendLines = legendLines;
        this.#yTickStep = yTickStep;
        this.#showWarningText = showWarningText;
        this.#warningText = warningText;
        this.#elementSpacing = elementSpacing;
        this.#tickAreaSize = tickAreaSize;
        this.#titleGap = titleGap;
        this.#boxFontSize = boxFontSize;
        this.#boxPosition = boxPosition;
        this.#boxBorderColor = boxBorderColor;
        this.#boxBackgroundColor = boxBackgroundColor;
        this.#boxOpacity = boxOpacity;
        this.#boxLeft = boxLeft;
        this.#boxTop = boxTop;
        this.#isDesign = isDesign;

        this.render();
    }

    createSVGElement(tag, attributes) {

        const element = document.createElementNS("http://www.w3.org/2000/svg", tag);

        for (const key in attributes) {
            element.setAttribute(key, attributes[key]);
        }

        return element;
    }

    calculateBoxPosition({ boxLeft, boxTop }) {

        return {
            manualBoxLeft: Math.max(Math.min(boxLeft, this.chart.plotArea.width - this.boxWidth), 0),
            manualBoxTop: Math.max(Math.min(boxTop, this.chart.plotArea.height - this.boxHeight), 0)
        };
    }

    setBoxPosition({ boxLeft, boxTop }) {
        this.boxElement.setAttribute("transform", `translate(${boxLeft}, ${boxTop})`);
    }

    render() {

        function polygonPath({ x, y, size, count, xOffset, yOffset, rotationOffset }) {

            let commands = [];

            for (let pointIndex = 0; pointIndex < count; pointIndex++) {

                const px = x + (xOffset * size) + (Math.sin((pointIndex + rotationOffset) / count * Math.PI * 2) * size);
                const py = y + (yOffset * size) + (Math.cos((pointIndex + rotationOffset) / count * Math.PI * 2) * size);

                commands.push(`${pointIndex === 0 ? "M" : "L"} ${px} ${py}`);
            }

            commands.push("Z");

            return commands.join(" ");
        }

        const graph = document.querySelector("template#variabilityPlot").content.cloneNode(true);

        const maskId = `mask-${crypto.randomUUID()}`;

        graph.querySelector("clipPath").setAttribute("id", maskId);
        graph.querySelector("g.plotArea").setAttribute("clip-path", `url(#${maskId})`);

        this.#targetElement.replaceChildren(graph);

        const svgElement = this.#targetElement.querySelector("svg");
        const gridLinesElement = svgElement.querySelector("g.gridLines");
        const markersElement = svgElement.querySelector("g.markers");
        const confidenceElement = svgElement.querySelector("g.confidence");
        const plotAreaElement = svgElement.querySelector("g.plotArea");
        const plotAreaMaskElement = svgElement.querySelector(`clipPath#${maskId}`);
        this.boxElement = svgElement.querySelector("g.box");

        svgElement.setAttribute("viewBox", `0 0 ${this.#width} ${this.#height}`);
        svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");

        // svgElement.setAttributeNS("http://www.w3.org/2000/svg", "svg:viewbox", `0 0 ${this.#width} ${this.#height}`);
        // svgElement.setAttributeNS("http://www.w3.org/2000/svg", "svg:preserveAspectRatio", "xMidYMid meet");

        // Arrange positions of chart elements.

        const chartWidth = this.#width;
        const chartHeight = this.#height;

        const warningExtraPadding = 8;

        const hundred = new FormattedText({ value: "100" });
        const titleBoundingBox = this.#title.getBoundingBox({ fontFamily: this.#titleFontFamily, fontSize: `${this.#titleFontSize}px`, });
        const xLabelBoundingBox = this.#xLabel.getBoundingBox({ fontFamily: this.#axisFontFamily, fontSize: `${this.#axisFontSize}px`, });
        const yLabelBoundingBox = this.#yLabel.getBoundingBox({ fontFamily: this.#axisFontFamily, fontSize: `${this.#axisFontSize}px`, });
        const hundredBoundingBox = hundred.getBoundingBox({ fontFamily: this.#tickFontFamily, fontSize: `${this.#tickFontSize}px` });

        const warningTextFontSize = "14px";

        const warningTextBoundingBox = this.#showWarningText ? this.#warningText.getBoundingBox({
            fontFamily: this.#titleFontFamily,
            fontSize: warningTextFontSize,
        }) : null;

        let positions = {
            title: { left: null, top: null, width: null, height: null },
            plotArea: { left: null, top: null, width: null, height: null },
            xTick: { left: null, top: null, width: null, height: null },
            yTick: { left: null, top: null, width: null, height: null },
            xLabel: { left: null, top: null, width: null, height: null },
            yLabel: { left: null, top: null, width: null, height: null },
            xScale: { left: null, top: null, width: null, height: null },
            yScale: { left: null, top: null, width: null, height: null },
            warning: { left: null, top: null, width: null, height: null },
        };

        const padding = {
            left: 2,
            top: 2,
            right: this.#tickFontSize,
            bottom: 2,
        };

        let xLabelBottom = this.#showWarningText ? chartHeight - this.#elementSpacing - warningTextBoundingBox.height - warningExtraPadding - padding.bottom : chartHeight - padding.bottom;

        positions.title.top = padding.top;
        positions.title.baseline = positions.title.top + titleBoundingBox.baseline - titleBoundingBox.top;
        positions.title.width = titleBoundingBox.width;
        positions.title.height = titleBoundingBox.height;

        positions.xTick.height = this.#tickAreaSize;
        positions.yTick.width = this.#tickAreaSize;

        positions.xLabel.width = xLabelBoundingBox.width;
        positions.xLabel.height = xLabelBoundingBox.height;
        positions.xLabel.top = xLabelBottom - positions.xLabel.height;
        positions.xLabel.baseline = positions.xLabel.top + xLabelBoundingBox.baseline - xLabelBoundingBox.top;

        positions.yLabel.left = padding.left;
        positions.yLabel.width = yLabelBoundingBox.height;
        positions.yLabel.height = yLabelBoundingBox.width;
        positions.yLabel.baseline = positions.yLabel.left + yLabelBoundingBox.baseline - yLabelBoundingBox.top;

        positions.xScale.height = hundredBoundingBox.height;
        positions.xScale.top = positions.xLabel.top - this.#elementSpacing - positions.xScale.height;
        positions.xScale.baseline = positions.xScale.top + hundredBoundingBox.baseline - hundredBoundingBox.top;

        positions.yScale.width = hundredBoundingBox.width;
        positions.yScale.left = padding.left + positions.yLabel.width + this.#elementSpacing + positions.yScale.width;

        positions.plotArea.left = padding.left + positions.yLabel.width + this.#elementSpacing + positions.yScale.width + positions.yTick.width;
        positions.plotArea.width = chartWidth - positions.plotArea.left - padding.right;
        positions.plotArea.top = positions.title.top + positions.title.height + this.#titleGap;
        positions.plotArea.height = positions.xScale.top - positions.xTick.height - positions.plotArea.top;

        if (this.#showWarningText) {
            positions.warning.top = chartHeight - padding.bottom - warningTextBoundingBox.height;
            positions.warning.left = Math.floor(positions.plotArea.left + (positions.plotArea.width / 2) - (warningTextBoundingBox.width / 2));
            positions.warning.width = warningTextBoundingBox.width;
            positions.warning.height = warningTextBoundingBox.height;
            positions.warning.baseline = chartHeight - padding.bottom - warningTextBoundingBox.height + warningTextBoundingBox.baseline - warningTextBoundingBox.top
        }

        for (let element in positions) {
            positions[element].right = positions[element].left + positions[element].width;
            positions[element].middle = positions[element].left + Math.floor(positions[element].width / 2);
            positions[element].bottom = positions[element].top + positions[element].height;
        }

        this.chart = {
            chartArea: {
                width: chartWidth,
                height: chartHeight
            },
            plotArea: {
                left: positions.plotArea.left,
                right: positions.plotArea.left + positions.plotArea.width,
                top: positions.plotArea.top,
                bottom: positions.plotArea.top + positions.plotArea.height,
                width: positions.plotArea.width,
                height: positions.plotArea.height
            },
            margin: {
                left: 70,
                top: 70,
                right: 20,
                bottom: 60,
            },
            x: {
                tickSize: 6,
                tickAreaSize: positions.xTick.height,
                tickLabelPosition: positions.xScale.baseline,
                min: 0.5,
                max: this.#data.length + 0.5,
            },
            y: {
                minorGridStep: this.#yTickStep,
                tickStep: this.#yTickStep,
                tickSize: 6,
                tickAreaSize: positions.yTick.width,
                tickLabelPosition: positions.yScale.left,
                labelStep: this.#yTickStep,
                min: 0,
                max: 100,
            },
            point: {
                style: this.#pointType,
                size: parseFloat(this.#pointSize),
                weight: this.#pointWeight,
                color: this.#pointColor,
            },
            scales: {
            }
        }

        this.chart.scales.x = new CartesianScale({
            chart: this,
            scaleConfig: this.chart.x,
            plotStart: positions.plotArea.left,
            plotEnd: positions.plotArea.right,
            data: this.#data.map(pair => pair.x),
            min: this.chart.x.min,
            max: this.chart.x.max,
            tickFontSize: `${this.#tickFontSize}px`,
            vertical: false,
        });

        this.chart.scales.y = new CartesianScale({
            chart: this,
            scaleConfig: this.chart.y,
            plotStart: positions.plotArea.top,
            plotEnd: this.chart.plotArea.bottom,
            data: this.#data.map(pair => pair.y),
            min: this.chart.y.min,
            max: this.chart.y.max,
            tickFontSize: `${this.#tickFontSize}px`,
            vertical: true,
        });

        // Plot area mask.

        plotAreaMaskElement.append(this.createSVGElement("rect", {
            x: positions.plotArea.left,
            y: positions.plotArea.top,
            width: this.chart.plotArea.width,
            height: this.chart.plotArea.height
        }));

        this.chart.scales.x.calculateSteps();
        this.chart.scales.x.renderGridlines(gridLinesElement);
        this.chart.scales.x.renderTickMarks(svgElement);
        this.chart.scales.x.renderTickLabels(svgElement);

        this.chart.scales.y.calculateSteps();
        this.chart.scales.y.renderGridlines(gridLinesElement);
        this.chart.scales.y.renderTickMarks(svgElement);
        this.chart.scales.y.renderTickLabels(svgElement);

        if (this.#title) {

            this.#title.renderSVG({
                element: svgElement,
                x: this.chart.plotArea.left + Math.floor(this.chart.plotArea.width / 2),
                y: positions.title.baseline,
                fontFamily: this.#titleFontFamily,
                fontSize: `${this.#titleFontSize}px`,
                rotation: 0
            });
        }

        if (this.#xLabel) {

            this.#xLabel.renderSVG({
                element: svgElement,
                x: this.chart.plotArea.left + Math.floor(this.chart.plotArea.width / 2),
                y: positions.xLabel.baseline,
                fontFamily: this.#axisFontFamily,
                fontSize: `${this.#axisFontSize}px`,
                rotation: 0
            });
        }

        if (this.#yLabel) {

            this.#yLabel.renderSVG({
                element: svgElement,
                x: positions.yLabel.baseline,
                y: positions.plotArea.top + Math.floor(this.chart.plotArea.height / 2),
                fontFamily: this.#axisFontFamily,
                fontSize: `${this.#axisFontSize}px`,
                rotation: -90
            });
        }

        if (this.#showWarningText) {

            this.#warningText.renderSVG({
                element: svgElement,
                x: positions.warning.middle,
                y: positions.warning.baseline,
                fontFamily: this.#titleFontFamily,
                fontSize: warningTextFontSize,
                rotation: 0
            });

            const warningTriangleGap = 10;

            const warningTriangle = this.createSVGElement("g", {
                "transform": `translate(${positions.warning.left - warningTriangleGap - positions.warning.height}, ${positions.warning.top}) scale(${positions.warning.height / 16})`
            });

            warningTriangle.append(this.createSVGElement("path", {
                fill: "#fb5",
                d: "M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z"
            }));

            warningTriangle.append(this.createSVGElement("path", {
                fill: "black",
                d: "M8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"
            }));

            svgElement.append(warningTriangle);
        }

        // Plot backgroud.

        plotAreaElement.insertAdjacentElement("beforebegin", this.createSVGElement("rect", {
            class: "plotBackground",
            x: this.chart.plotArea.left,
            y: positions.plotArea.top,
            width: this.chart.plotArea.width,
            height: this.chart.plotArea.height
        }));

        // Plot area border.

        svgElement.append(this.createSVGElement("rect", {
            class: "axisLines",
            x: this.chart.plotArea.left,
            y: positions.plotArea.top,
            width: this.chart.plotArea.width,
            height: this.chart.plotArea.height
        }));

        // Confidence interval.

        const bandTop = this.chart.scales.y.pos(this.#confidenceUpperLimit);
        const bandBottom = this.chart.scales.y.pos(this.#confidenceLowerLimit);

        confidenceElement.append(this.createSVGElement("rect", {
            fill: this.#bandColor,
            stroke: "none",
            "fill-opacity": 0.5,
            x: this.chart.plotArea.left,
            y: bandTop,
            width: this.chart.plotArea.width,
            height: bandBottom - bandTop,
        }));

        // Mean line.

        const meanPos = this.chart.scales.y.pos(this.#meanValue);

        confidenceElement.append(this.createSVGElement("line", {
            stroke: this.#meanColor,
            "stroke-width": this.#meanWeight,
            fill: "none",
            x1: this.chart.plotArea.left,
            y1: meanPos,
            x2: this.chart.plotArea.right,
            y2: meanPos,
        }));

        // Points.

        for (const { x, y } of this.#data) {

            switch (this.chart.point.style) {

                case "circle":

                    markersElement.append(this.createSVGElement("circle", {
                        stroke: this.chart.point.color,
                        "stroke-width": this.chart.point.weight,
                        fill: "none",
                        cx: this.chart.scales.x.pos(x),
                        cy: this.chart.scales.y.pos(y),
                        r: this.chart.point.size
                    }));

                    break;

                case "filledCircle":

                    markersElement.append(this.createSVGElement("circle", {
                        stroke: "none",
                        fill: this.chart.point.color,
                        cx: this.chart.scales.x.pos(x),
                        cy: this.chart.scales.y.pos(y),
                        r: this.chart.point.size
                    }));

                    break;

                case "square":

                    markersElement.append(this.createSVGElement("path", {
                        stroke: this.chart.point.color,
                        "stroke-width": this.chart.point.weight,
                        fill: "none",
                        d: polygonPath({
                            x: this.chart.scales.x.pos(x),
                            y: this.chart.scales.y.pos(y),
                            size: this.chart.point.size * Math.sqrt(2),
                            count: 4,
                            xOffset: 0,
                            yOffset: 0,
                            rotationOffset: 0.5
                        })
                    }));

                    break;

                case "filledSquare":

                    markersElement.append(this.createSVGElement("path", {
                        stroke: "none",
                        fill: this.chart.point.color,
                        d: polygonPath({
                            x: this.chart.scales.x.pos(x),
                            y: this.chart.scales.y.pos(y),
                            size: this.chart.point.size * Math.sqrt(2),
                            count: 4,
                            xOffset: 0,
                            yOffset: 0,
                            rotationOffset: 0.5
                        })
                    }));

                    break;

                case "diamond":

                    markersElement.append(this.createSVGElement("path", {
                        stroke: this.chart.point.color,
                        "stroke-width": this.chart.point.weight,
                        fill: "none",
                        d: polygonPath({
                            x: this.chart.scales.x.pos(x),
                            y: this.chart.scales.y.pos(y),
                            size: this.chart.point.size * Math.sqrt(2),
                            count: 4,
                            xOffset: 0,
                            yOffset: 0,
                            rotationOffset: 0
                        })
                    }));

                    break;

                case "filledDiamond":

                    markersElement.append(this.createSVGElement("path", {
                        stroke: "none",
                        fill: this.chart.point.color,
                        d: polygonPath({
                            x: this.chart.scales.x.pos(x),
                            y: this.chart.scales.y.pos(y),
                            size: this.chart.point.size * Math.sqrt(2),
                            count: 4,
                            xOffset: 0,
                            yOffset: 0,
                            rotationOffset: 0
                        })
                    }));

                    break;

                case "triangle":

                    markersElement.append(this.createSVGElement("path", {
                        stroke: this.chart.point.color,
                        "stroke-width": this.chart.point.weight,
                        fill: "none",
                        d: polygonPath({
                            x: this.chart.scales.x.pos(x),
                            y: this.chart.scales.y.pos(y),
                            size: this.chart.point.size * Math.sqrt(2),
                            count: 3,
                            xOffset: 0,
                            yOffset: -0.15,
                            rotationOffset: 0
                        })
                    }));

                    break;

                case "filledTriangle":

                    markersElement.append(this.createSVGElement("path", {
                        stroke: "none",
                        fill: this.chart.point.color,
                        d: polygonPath({
                            x: this.chart.scales.x.pos(x),
                            y: this.chart.scales.y.pos(y),
                            size: this.chart.point.size * Math.sqrt(2),
                            count: 3,
                            xOffset: 0,
                            yOffset: -0.15,
                            rotationOffset: 0
                        })
                    }));

                    break;

                case "plus":

                    markersElement.append(this.createSVGElement("line", {
                        stroke: this.chart.point.color,
                        "stroke-width": this.chart.point.weight,
                        x1: this.chart.scales.x.pos(x),
                        y1: this.chart.scales.y.pos(y) - this.chart.point.size,
                        x2: this.chart.scales.x.pos(x),
                        y2: this.chart.scales.y.pos(y) + this.chart.point.size,
                    }));

                    markersElement.append(this.createSVGElement("line", {
                        stroke: this.chart.point.color,
                        "stroke-width": this.chart.point.weight,
                        x1: this.chart.scales.x.pos(x) - this.chart.point.size,
                        y1: this.chart.scales.y.pos(y),
                        x2: this.chart.scales.x.pos(x) + this.chart.point.size,
                        y2: this.chart.scales.y.pos(y),
                    }));

                    break;

                case "cross":

                    markersElement.append(this.createSVGElement("line", {
                        stroke: this.chart.point.color,
                        "stroke-width": this.chart.point.weight,
                        x1: this.chart.scales.x.pos(x) - this.chart.point.size,
                        y1: this.chart.scales.y.pos(y) - this.chart.point.size,
                        x2: this.chart.scales.x.pos(x) + this.chart.point.size,
                        y2: this.chart.scales.y.pos(y) + this.chart.point.size,
                    }));

                    markersElement.append(this.createSVGElement("line", {
                        stroke: this.chart.point.color,
                        "stroke-width": this.chart.point.weight,
                        x1: this.chart.scales.x.pos(x) + this.chart.point.size,
                        y1: this.chart.scales.y.pos(y) - this.chart.point.size,
                        x2: this.chart.scales.x.pos(x) - this.chart.point.size,
                        y2: this.chart.scales.y.pos(y) + this.chart.point.size,
                    }));

                    break;
            }
        }

        // Box overlay.

        const boxMargin = 10;
        const boxLineGap = 4;

        const boxOffsetX = 20;
        const boxOffsetY = 20;

        const boxBackground = this.createSVGElement("rect", {
            stroke: "none",
            x: 0,
            y: 0,
            width: 0,
            height: 0
        })

        const boxBorder = this.createSVGElement("rect", {
            fill: "none",
            x: 0,
            y: 0,
            width: 0,
            height: 0
        })

        this.boxElement.append(boxBackground, boxBorder);

        let boxLines = this.#legendLines.map(text => ({ formattedText: new FormattedText({ value: text }) }));

        for (const boxLine of boxLines) {
            boxLine.bBox = boxLine.formattedText.getBoundingBox({ fontFamily: this.#boxFontFamily, fontSize: `${this.#boxFontSize}px` });
        }

        const maxTextWidth = Math.max(...boxLines.map(boxLine => boxLine.bBox.width));

        // Calculate box size.

        let linePosition = boxMargin;

        for (const boxLine of boxLines) {

            linePosition += boxLine.bBox.baseline - boxLine.bBox.top;

            boxLine.formattedText.renderSVG({
                element: this.boxElement,
                x: boxMargin + (boxLine.bBox.width / 2),
                y: linePosition,
                fontFamily: this.#boxFontFamily,
                fontSize: `${this.#boxFontSize}px`,
                rotation: 0
            });

            linePosition += boxLineGap + boxLine.bBox.bottom - boxLine.bBox.baseline;
        }

        this.boxWidth = maxTextWidth + (boxMargin * 2);
        this.boxHeight = linePosition - boxLineGap + boxMargin;

        boxBackground.setAttribute("width", this.boxWidth);
        boxBackground.setAttribute("height", this.boxHeight);
        boxBackground.setAttribute("fill", this.#boxBackgroundColor);
        boxBackground.setAttribute("fill-opacity", this.#boxOpacity);

        boxBorder.setAttribute("width", this.boxWidth);
        boxBorder.setAttribute("height", this.boxHeight);
        boxBorder.setAttribute("stroke", this.#boxBorderColor);

        const leftPosition = this.chart.plotArea.left + boxOffsetX;
        const rightPosition = this.chart.plotArea.left + this.chart.plotArea.width - this.boxWidth - boxOffsetX;
        const topPosition = positions.plotArea.top + boxOffsetY;
        const bottomPosition = positions.plotArea.top + this.chart.plotArea.height - this.boxHeight - boxOffsetY;

        const { manualBoxLeft, manualBoxTop } = this.calculateBoxPosition({
            boxLeft: this.#boxLeft,
            boxTop: this.#boxTop
        });

        let boxLeft;
        let boxTop;

        switch (this.#boxPosition) {

            case "bottomRight":
                boxLeft = rightPosition;
                boxTop = bottomPosition;
                break;

            case "bottomLeft":
                boxLeft = leftPosition;
                boxTop = bottomPosition;
                break;

            case "topRight":
                boxLeft = rightPosition;
                boxTop = topPosition;
                break;

            case "topLeft":
                boxLeft = leftPosition;
                boxTop = topPosition;
                break;

            case "manual":
                boxLeft = manualBoxLeft + this.chart.plotArea.left;
                boxTop = manualBoxTop + this.chart.plotArea.top;
                break;
        }

        this.setBoxPosition({ boxLeft, boxTop });
    }
}
