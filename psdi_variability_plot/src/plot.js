// plot.js

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

    renderTickLabels(element) {

        for (const value of this.#getDivs(this.#labelStep)) {

            const labelText = value.toString();

            let textElement;

            if (this.#vertical) {

                textElement = this.#chart.createSVGElement("text", {
                    class: "yTickLabel",
                    "font-size": this.#tickFontSize,
                    x: this.#chart.chart.plotArea.left - this.#chart.chart.y.tickLabelOffset,
                    y: this.pos(value),
                });

            } else {

                textElement = this.#chart.createSVGElement("text", {
                    class: "xTickLabel",
                    "font-size": this.#tickFontSize,
                    x: this.pos(value),
                    y: this.#chart.chart.plotArea.bottom + this.#chart.chart.x.tickLabelOffset,
                });
            }

            textElement.textContent = labelText;

            element.append(textElement);
        }
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

        if (this.#minorGridStep === undefined) {
            this.#minorGridStep = this.findIdealStep(this.#minTickGap);
        }

        if (this.#tickStep === undefined) {
            this.#tickStep = this.findIdealStep(this.#minTickGap);
        }

        if (this.#labelStep === undefined) {
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

    #medianValue;
    #confidenceUpperLimit;
    #confidenceLowerLimit;

    #width;
    #height;
    #pointType;
    #pointColor;
    #pointWeight;
    #pointSize;
    #bandColor;
    #medianColor;
    #title;
    #xLabel;
    #yLabel;
    #titleFontFamily = "OpenSans";
    #titleFontSize;
    #axisFontFamily = "OpenSans";
    #axisFontSize;
    #tickfontFamily = "OpenSans";
    #tickfontSize;

    #legendLines;

    // This canvas context is used to get text metrics.
    #canvasContext;

    constructor({ targetElement, width, height, pointType, pointColor, pointWeight, pointSize,
        bandColor, medianColor, title, xLabel, yLabel, titleFontSize, axisFontSize, tickfontSize,
        data, medianValue, confidenceUpperLimit, confidenceLowerLimit, legendLines }) {

        this.#targetElement = targetElement;
        this.#data = data;
        this.#medianValue = medianValue;
        this.#confidenceUpperLimit = confidenceUpperLimit;
        this.#confidenceLowerLimit = confidenceLowerLimit;
        this.#width = width;
        this.#height = height;
        this.#pointType = pointType;
        this.#pointColor = pointColor;
        this.#pointWeight = pointWeight;
        this.#pointSize = pointSize;
        this.#bandColor = bandColor;
        this.#medianColor = medianColor;
        this.#title = title;
        this.#xLabel = xLabel;
        this.#yLabel = yLabel;
        this.#canvasContext = document.createElement("canvas").getContext("2d");
        this.#titleFontSize = titleFontSize;
        this.#axisFontSize = axisFontSize;
        this.#tickfontSize = tickfontSize;
        this.#legendLines = legendLines;

        this.render();
    }

    createSVGElement(tag, attributes) {

        const element = document.createElementNS("http://www.w3.org/2000/svg", tag);

        for (const key in attributes) {
            element.setAttribute(key, attributes[key]);
        }

        return element;
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

        this.#targetElement.replaceChildren(graph);

        const svgElement = this.#targetElement.querySelector("svg");
        const gridLinesElement = svgElement.querySelector("g.gridLines");
        const markersElement = svgElement.querySelector("g.markers");
        const confidenceElement = svgElement.querySelector("g.confidence");
        const legendElement = svgElement.querySelector("g.legend");
        const plotAreaElement = svgElement.querySelector("g.plotArea");
        const plotAreaMaskElement = svgElement.querySelector("clipPath#plotAreaMask");

        svgElement.setAttribute("width", this.#width);
        svgElement.setAttribute("height", this.#height);

        const chartWidth = svgElement.clientWidth;
        const chartHeight = svgElement.clientHeight;

        // Calculate positions of chart elements.

        if (this.#title) {
            // console.log(this.#title.getBoundingBox({
            //     fontFamily: this.#titleFontFamily,
            //     fontSize: `${this.#titleFontSize}pt`,
            // }));
        }

        this.chart = {
            chartArea: {
                width: chartWidth,
                height: chartHeight
            },
            plotArea: {
            },
            margin: {
                left: 70,
                top: 70,
                right: 20,
                bottom: 60,
            },
            x: {
                tickSize: 6,
                tickLabelOffset: 12,
                min: 0.5,
                max: this.#data.length + 0.5,
            },
            y: {
                minorGridStep: 20,
                tickStep: 20,
                tickSize: 6,
                tickLabelOffset: 12,
                labelStep: 20,
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

        this.chart.plotArea.left = this.chart.margin.left;
        this.chart.plotArea.top = this.chart.margin.top;
        this.chart.plotArea.right = this.chart.chartArea.width - this.chart.margin.right;
        this.chart.plotArea.bottom = this.chart.chartArea.height - this.chart.margin.bottom;
        this.chart.plotArea.width = this.chart.chartArea.width - this.chart.margin.left - this.chart.margin.right;
        this.chart.plotArea.height = this.chart.chartArea.height - this.chart.margin.top - this.chart.margin.bottom;

        this.chart.scales.x = new CartesianScale({
            chart: this,
            scaleConfig: this.chart.x,
            plotStart: this.chart.plotArea.left,
            plotEnd: this.chart.plotArea.right,
            data: this.#data.map(pair => pair.x),
            min: this.chart.x.min,
            max: this.chart.x.max,
            tickFontSize: `${this.#tickfontSize}pt`,
            vertical: false,
        });

        this.chart.scales.y = new CartesianScale({
            chart: this,
            scaleConfig: this.chart.y,
            plotStart: this.chart.plotArea.top,
            plotEnd: this.chart.plotArea.bottom,
            data: this.#data.map(pair => pair.y),
            min: this.chart.y.min,
            max: this.chart.y.max,
            tickFontSize: `${this.#tickfontSize}pt`,
            vertical: true,
        });

        // Plot area mask.

        plotAreaMaskElement.append(this.createSVGElement("rect", {
            x: this.chart.plotArea.left,
            y: this.chart.plotArea.top,
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
                y: 50,
                fontFamily: this.#titleFontFamily,
                fontSize: `${this.#titleFontSize}pt`,
                rotation: 0
            });
        }

        if (this.#xLabel) {

            this.#xLabel.renderSVG({
                element: svgElement,
                x: this.chart.plotArea.left + Math.floor(this.chart.plotArea.width / 2),
                y: this.chart.plotArea.bottom + 50,
                fontFamily: this.#axisFontFamily,
                fontSize: `${this.#axisFontSize}pt`,
                rotation: 0
            });
        }

        if (this.#yLabel) {

            this.#yLabel.renderSVG({
                element: svgElement,
                x: 20,
                y: this.chart.plotArea.top + Math.floor(this.chart.plotArea.height / 2),
                fontFamily: this.#axisFontFamily,
                fontSize: `${this.#axisFontSize}pt`,
                rotation: -90
            });
        }

        // Plot backgroud.

        plotAreaElement.insertAdjacentElement("beforebegin", this.createSVGElement("rect", {
            class: "plotBackground",
            x: this.chart.plotArea.left,
            y: this.chart.plotArea.top,
            width: this.chart.plotArea.width,
            height: this.chart.plotArea.height
        }));

        // Plot area border.

        svgElement.append(this.createSVGElement("rect", {
            class: "axisLines",
            x: this.chart.plotArea.left,
            y: this.chart.plotArea.top,
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

        // Median line.

        const medianPos = this.chart.scales.y.pos(this.#medianValue);

        confidenceElement.append(this.createSVGElement("line", {
            stroke: this.#medianColor,
            "stroke-width": 4,
            fill: "none",
            x1: this.chart.plotArea.left,
            y1: medianPos,
            x2: this.chart.plotArea.right,
            y2: medianPos,
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

        // Legend overlay.

        const legendBoxMargin = 10;
        const legendLineGap = 4;
        const legendLineHeight = 17.33;

        const legendBoxOffsetX = -20;
        const legendBoxOffsetY = -20;

        let legendLines = [
            {
                element: this.createSVGElement("text", {
                    // x: legendBoxMargin,
                    // y: legendBoxMargin + legendLineHeight,
                }),
                text: this.#legendLines[0]
            },
            {
                element: this.createSVGElement("text", {
                    // x: legendBoxMargin,
                    // y: legendBoxMargin + legendLineHeight * 2 + legendLineGap,
                }),
                text: this.#legendLines[1]
            }
        ];

        const legendBackground = this.createSVGElement("rect", {
            class: "legendBackground",
            x: 0,
            y: 0,
            width: 0,
            height: 0
        })

        const legendBorder = this.createSVGElement("rect", {
            class: "legendBorder",
            x: 0,
            y: 0,
            width: 0,
            height: 0
        })

        legendElement.append(legendBackground, legendBorder);

        for (const legendLine of legendLines) {
            legendLine.element.textContent = legendLine.text;
            legendElement.append(legendLine.element);
        }

        for (const legendLine of legendLines) {
            legendLine.element.setAttribute("textLength", legendLine.element.getBBox().width);
            legendLine.element.setAttribute("lengthAdjust", "spacingAndGlyphs");
        }

        // Calculate box size.

        const boundingBoxes = legendLines.map(line => line.element.getBBox());

        const maxTextWidth = Math.max(...boundingBoxes.map(box => box.width));

        let linePosition = legendBoxMargin;

        for (const legendLine of legendLines) {

            legendLine.element.setAttribute("x", legendBoxMargin);
            legendLine.element.setAttribute("y", linePosition + legendLineHeight);

            linePosition += legendLineHeight + legendLineGap;
        }

        const legendBoxWidth = maxTextWidth + (legendBoxMargin * 2);
        const legendBoxHeight = (legendBoxMargin * 2) + (legendLineHeight * legendLines.length) + (legendLineGap * (legendLines.length - 1));

        legendBackground.setAttribute("width", legendBoxWidth);
        legendBackground.setAttribute("height", legendBoxHeight);
        legendBorder.setAttribute("width", legendBoxWidth);
        legendBorder.setAttribute("height", legendBoxHeight);

        const legendBoxLeft = this.chart.plotArea.left + this.chart.plotArea.width - legendBoxWidth + legendBoxOffsetX;
        const legendBoxTop = this.chart.plotArea.top + this.chart.plotArea.height - legendBoxHeight + legendBoxOffsetY;

        legendElement.setAttribute("transform", `translate(${legendBoxLeft}, ${legendBoxTop})`);
    }
}
