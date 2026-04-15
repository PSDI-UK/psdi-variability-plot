// formattedText.js

export class FormattedText {

    #quill;
    #editArea;

    constructor({ element, value: initialValue, changeFunc }) {

        if (element === undefined) {

            this.#editArea = document.createElement("span");
            this.#editArea.innerHTML = initialValue;

        } else {

            this.#editArea = element;

            const toolbarTemplate = document.querySelector("template#formattedEditor");

            const templateContent = document.createElement("div");
            templateContent.append(...toolbarTemplate.content.cloneNode(true).children);

            const toolbar = templateContent.querySelector(".formattedEditorPalette");
            const symbolSelector = templateContent.querySelector(".symbolSelector");

            this.#editArea.insertAdjacentElement("beforebegin", toolbar);
            this.#editArea.insertAdjacentElement("beforebegin", symbolSelector);

            const insertSymbolButton = toolbar.querySelector('.insertSymbolButton');

            let bindings = {

                tab: {
                    key: [9, "tab", "Tab"],
                    handler: () => true
                },
                enter: {
                    key: [13, "enter", "Enter"],
                    handler: () => false
                },
                shiftEnter: {
                    key: [13, "enter", "Enter"],
                    shiftKey: true,
                    handler: () => false
                }
            };

            const quill = new Quill(this.#editArea, {
                placeholder: this.#editArea.getAttribute("data-placeholder"),
                formats: ['italic', 'bold', 'underline', 'script'],
                modules: {
                    toolbar,
                    keyboard: {
                        bindings
                    }
                },
            });

            this.#quill = quill;

            const contentEditableArea = this.#editArea.querySelector("[contenteditable=true]");

            function replaceText(quill, text) {

                const selection = quill.getSelection();

                if (selection !== null) {
                    quill.deleteText(selection.index, selection.length);
                }

                quill.insertText(selection ? selection.index : quill.getLength() - 1, text);
            }

            for (const symbolButton of symbolSelector.querySelectorAll("button")) {

                symbolButton.addEventListener("click", function () {
                    replaceText(quill, symbolButton.textContent);
                    symbolSelector.hidden = true;
                    insertSymbolButton.classList.remove("ql-active");
                });
            }

            insertSymbolButton.addEventListener("click", function () {
                symbolSelector.hidden = !symbolSelector.hidden;
                if (symbolSelector.hidden)
                    insertSymbolButton.classList.remove("ql-active");
                else
                    insertSymbolButton.classList.add("ql-active");
            })

            function processSelectedElementChange(event) {

                const nextElement = event.type === "focusin" ? event.target : event.relatedTarget;

                // Process symbol selector.

                if (symbolSelector.hidden == false) {

                    let hideSymbolSelector = true;

                    if (nextElement?.parentElement?.parentElement === symbolSelector) {
                        hideSymbolSelector = false;
                    }

                    if (hideSymbolSelector) {
                        symbolSelector.hidden = true
                        insertSymbolButton.classList.remove("ql-active");
                    }
                }

                let inactive = true;

                // Not finished if Quill's content editable area is active.

                if (nextElement === contentEditableArea) {
                    inactive = false;
                }

                // Not finished if one of the toolbar buttons is active.

                if (nextElement?.parentElement?.parentElement === toolbar) {
                    inactive = false;
                }

                // Not finished if one of the symbols in the symbol selector is active.

                if (nextElement?.parentElement?.parentElement === symbolSelector) {
                    inactive = false;
                }

                toolbar.hidden = inactive;

                if (inactive) {
                    symbolSelector.hidden = true;
                    insertSymbolButton.classList.remove("ql-active");
                }
            }

            element.addEventListener("focusin", processSelectedElementChange);
            element.addEventListener("focusout", processSelectedElementChange);
            toolbar.addEventListener("focusin", processSelectedElementChange, { capture: true });
            toolbar.addEventListener("focusout", processSelectedElementChange, { capture: true });
            symbolSelector.addEventListener("focusin", processSelectedElementChange, { capture: true });
            symbolSelector.addEventListener("focusout", processSelectedElementChange, { capture: true });

            if (initialValue) {
                this.setFormattedContent(initialValue);
            }

            quill.on('text-change', (delta, oldDelta, source) => {
                if (changeFunc) {
                    changeFunc({ delta, oldDelta, source });
                }
            });
        }
    }

    #createSVGElement(tag, attributes) {

        const element = document.createElementNS("http://www.w3.org/2000/svg", tag);

        for (const key in attributes) {

            const value = attributes[key];

            if (value !== undefined) {
                element.setAttribute(key, value);
            }
        }

        return element;
    }

    #generateCopy(options) {

        const validStyles = {
            "B": true,
            "I": true,
            "U": true,
            "SUP": true,
            "SUB": true
        };

        const context = document.createElement("canvas").getContext("2d");

        const working = document.createElement("div");

        working.style.position = "absolute";
        working.style.left = "0";
        working.style.top = "0";
        working.style.whiteSpace = "nowrap";
        working.style.opacity = "0";
        working.style.fontFamily = options.fontFamily;
        working.style.fontSize = options.fontSize;

        document.body.append(working)

        let textSpans = [];

        function copy(node, active) {

            if (node.nodeType === 1) {
                if (validStyles[node.tagName]) {
                    active[node.tagName] = true;
                }
            }

            if (node.nodeType === 3) {

                const text = node.textContent;

                if (text.length > 0) {

                    if (Object.keys(active).length === 0) {
                        active["SPAN"] = true;
                    }

                    const [allText, preSpace, trimText, postSpace] = text.match(/^(\s*)(.*?)(\s*)$/s);

                    const section1 = Object.keys(active).filter(style => ["SPAN", "B", "I", "U"].includes(style));
                    const section2 = Object.keys(active).filter(style => ["SUB", "SUP"].includes(style));

                    const orderedStyles = section1.concat(section2);

                    let resultNode = document.createTextNode(trimText);

                    for (const tagName of orderedStyles) {

                        const wrapper = document.createElement(tagName);

                        wrapper.append(resultNode);
                        resultNode = wrapper;
                    }

                    working.append(preSpace, resultNode, postSpace);

                    textSpans.push({
                        node: resultNode,
                        active,
                    });
                }
            }

            for (const childNode of node.childNodes) {
                copy(childNode, structuredClone(active));
            }
        }

        copy(this.#editArea, {});

        const container = working.getBoundingClientRect()

        // Collect bounding boxes and font metrics.

        for (const textSpan of textSpans) {

            const style = window.getComputedStyle(textSpan.node);

            context.font = style.font;

            const fontMetrics = context.measureText(textSpan.node.textContent);

            const rect = textSpan.node.getBoundingClientRect();

            textSpan.fontSize = style.fontSize;

            textSpan.boundingBox = {
                left: rect.left - container.left,
                top: rect.top - container.top,
                right: rect.right - container.left,
                bottom: rect.bottom - container.top,
                baseline: rect.top - container.top + fontMetrics.fontBoundingBoxAscent
            };
        }

        // Calculate overall baseline.

        const testContent = "";

        const firstSpan = document.createElement("span");
        firstSpan.textContent = testContent;

        working.insertAdjacentElement("afterbegin", firstSpan);

        const firstSpanStyle = window.getComputedStyle(firstSpan);

        context.font = firstSpanStyle.font;

        const overallBaseline = textSpans[0]?.boundingBox.baseline;

        working.remove();

        return { textSpans, overallBaseline };
    }

    #calculateBoundingBox({ textSpans, overallBaseline }) {

        if (overallBaseline === undefined) {
            return {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                baseline: 0,
                width: 0,
                height: 0
            };
        }

        const left = Math.floor(Math.min(...textSpans.map(textSpan => textSpan.boundingBox.left)));
        const top = Math.floor(Math.min(...textSpans.map(textSpan => textSpan.boundingBox.top)));
        const right = Math.ceil(Math.max(...textSpans.map(textSpan => textSpan.boundingBox.right)));
        const bottom = Math.ceil(Math.max(...textSpans.map(textSpan => textSpan.boundingBox.bottom)));
        const baseline = overallBaseline;

        const box = {
            left, top, right, bottom, baseline,
            width: right - left,
            height: bottom - top
        }

        return box;
    }

    renderSVG({ element, x, y, rotation, fontFamily, fontSize }) {

        const { textSpans, overallBaseline } = this.#generateCopy({ fontFamily, fontSize });

        const boundingBox = this.#calculateBoundingBox({ textSpans, overallBaseline })

        const group = this.#createSVGElement("g", {
            transform: `translate(${x} ${y}) rotate(${rotation})`
        });

        const halfWidth = Math.round((boundingBox.right - boundingBox.left) / 2);

        const xOffset = -halfWidth;
        const yOffset = -(boundingBox.baseline);

        element.append(group);

        for (const textSpan of textSpans) {

            const text = this.#createSVGElement("text");

            text.textContent = textSpan.node.textContent;

            text.setAttribute("x", xOffset + textSpan.boundingBox.left);
            text.setAttribute("y", yOffset + textSpan.boundingBox.baseline);
            text.setAttribute("textLength", textSpan.boundingBox.right - textSpan.boundingBox.left);
            text.setAttribute("lengthAdjust", "spacingAndGlyphs");

            text.setAttribute("font-size", textSpan.fontSize);

            if (textSpan.active["B"]) {
                text.setAttribute("font-weight", "700");
            }

            if (textSpan.active["I"]) {
                text.setAttribute("font-style", "italic");
            }

            if (textSpan.active["U"]) {
                text.setAttribute("text-decoration", "underline");
            }

            group.append(text);

            // Bounding box.

            // group.append(this.#createSVGElement("rect", {
            //     stroke: "#808",
            //     "stroke-width": 1,
            //     fill: "none",
            //     x: xOffset + textSpan.boundingBox.left,
            //     y: yOffset + textSpan.boundingBox.top,
            //     width: textSpan.boundingBox.right - textSpan.boundingBox.left,
            //     height: textSpan.boundingBox.bottom - textSpan.boundingBox.top
            // }));
        }

        // group.append(this.#createSVGElement("rect", {
        //     stroke: "#626",
        //     "stroke-width": 1,
        //     fill: "none",
        //     x: xOffset + boundingBox.left,
        //     y: yOffset + boundingBox.top,
        //     width: boundingBox.right - boundingBox.left,
        //     height: boundingBox.bottom - boundingBox.top
        // }));

        // // Text origin marker.

        // element.append(this.#createSVGElement("circle", {
        //     stroke: "#808",
        //     "stroke-width": 1,
        //     fill: "none",
        //     cx: x,
        //     cy: y,
        //     r: 2
        // }));
    }

    getBoundingBox({ fontFamily, fontSize }) {

        const { textSpans, overallBaseline } = this.#generateCopy({ fontFamily, fontSize });

        return this.#calculateBoundingBox({ textSpans, overallBaseline });
    }

    getFormattedContent() {

        if (this.#quill) {

            const rootElement = document.createElement("div");

            rootElement.innerHTML = this.#quill.getSemanticHTML();

            function aux(element) {

                for (const child of element.children) {

                    aux(child);

                    if (child.tagName === "STRONG") {
                        const newElement = document.createElement("B");

                        newElement.replaceChildren(...child.childNodes);
                        child.replaceWith(newElement);
                    }

                    if (child.tagName === "EM") {
                        const newElement = document.createElement("I");

                        newElement.replaceChildren(...child.childNodes);
                        child.replaceWith(newElement);
                    }
                }
            }

            aux(rootElement);

            return rootElement.querySelector("p").innerHTML;

        } else {

            return this.#editArea.innerHTML;
        }
    }

    setFormattedContent(content) {

        if (this.#quill) {
            this.#quill.setContents(this.#quill.clipboard.convert({ html: content }), 'silent');
        } else {
            this.#editArea.innerHTML = content;
        }
    }

    getTextContent() {
        return this.#quill.getText().trim();
    }
}
