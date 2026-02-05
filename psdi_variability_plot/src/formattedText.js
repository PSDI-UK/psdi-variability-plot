// formattedText.js

const paletteMarkup = `
    <div>
        <button tabindex="0" type="button" class="boldButton">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                class="bi bi-type-bold" viewBox="0 0 16 16">
                <path
                    d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.673zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z" />
            </svg>
        </button><button tabindex="0" type="button" class="italicButton">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                class="bi bi-type-italic" viewBox="0 0 16 16">
                <path
                    d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z" />
            </svg>
        </button><button tabindex="0" type="button" class="underlineButton">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                class="bi bi-type-underline" viewBox="0 0 16 16">
                <path
                    d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 3.917 3.623s3.917-1.518 3.917-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.687 2.57s-2.687-1.08-2.687-2.57zM12.5 15h-9v-1h9z" />
            </svg>
        </button><button tabindex="0" type="button" class="superscriptButton">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                class="bi bi-superscript" viewBox="0 0 16 16">
                <path
                    d="m4.266 12.496.96-2.853H8.76l.96 2.853H11L7.62 3H6.38L3 12.496zm2.748-8.063 1.419 4.23h-2.88l1.426-4.23zm5.132-1.797v-.075c0-.332.234-.618.619-.618.354 0 .618.256.618.58 0 .362-.271.649-.52.898l-1.788 1.832V6h3.59v-.958h-1.923v-.045l.973-1.04c.415-.438.867-.845.867-1.547 0-.8-.701-1.41-1.787-1.41C11.565 1 11 1.8 11 2.576v.06z" />
            </svg>
        </button><button tabindex="0" type="button" class="subscriptButton">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                class="bi bi-subscript" viewBox="0 0 16 16">
                <path
                    d="m3.266 12.496.96-2.853H7.76l.96 2.853H10L6.62 3H5.38L2 12.496zm2.748-8.063 1.419 4.23h-2.88l1.426-4.23zm6.132 7.203v-.075c0-.332.234-.618.619-.618.354 0 .618.256.618.58 0 .362-.271.649-.52.898l-1.788 1.832V15h3.59v-.958h-1.923v-.045l.973-1.04c.415-.438.867-.845.867-1.547 0-.8-.701-1.41-1.787-1.41-1.23 0-1.795.8-1.795 1.576v.06z" />
            </svg>
        </button><button tabindex="0" type="button" popovertarget="symbolPopover1" class="insertSymbolButton" style="width: 24px; height: 24px">
            Ω
        </button>
    </div>
`;

const symbolPopoverMarkup = `
    <div popover class="symbolPopover" id="symbolPopover1">
        <div class="symbolSelector">
            <button>°</button> <button>Å</button> <button>→</button> <button>⟹</button> <button>+</button>
            <button>-</button> <button>×</button> <button>÷</button> <button>±</button> <button>∓</button>
            <button>=</button> <button>≠</button> <button>&lt;</button> <button>></button> <button>≤</button>
            <button>≥</button> <button>≲</button> <button>≳</button> <button>≪</button> <button>≫</button>
            <button>α</button> <button>β</button> <button>γ</button> <button>δ</button> <button>ε</button>
            <button>ζ</button> <button>η</button> <button>θ</button> <button>ι</button> <button>κ</button>
            <button>λ</button> <button>μ</button> <button>ν</button> <button>ξ</button> <button>ο</button>
            <button>π</button> <button>ρ</button> <button>ς</button> <button>σ</button> <button>τ</button>
            <button>υ</button> <button>φ</button> <button>χ</button> <button>ψ</button> <button>ω</button>
            <button>Α</button> <button>Β</button> <button>Γ</button> <button>Δ</button> <button>Ε</button>
            <button>Ζ</button> <button>Η</button> <button>Θ</button> <button>Ι</button> <button>Κ</button>
            <button>Λ</button> <button>Μ</button> <button>Ν</button> <button>Ξ</button> <button>Ο</button>
            <button>Π</button> <button>Ρ</button> <button>Σ</button> <button>Τ</button> <button>Υ</button>
            <button>Φ</button> <button>Χ</button> <button>Ψ</button> <button>Ω</button>
        </div>
    </div>
`;

const styleTags = {
    bold: "b",
    italic: "i",
    underline: "u",
    superscript: "sup",
    subscript: "sub"
};

export class FormattedText {

    #editArea;

    #observer;

    #commandPalette;
    #symbolPopover;
    #symbolSelector;

    #eventHandlers = [];

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

        // Collect bounding boxes and font metrics.

        for (const textSpan of textSpans) {

            const style = window.getComputedStyle(textSpan.node);

            context.font = style.font;

            const fontMetrics = context.measureText(textSpan.node.textContent);

            const container = working.getBoundingClientRect();
            const rect = textSpan.node.getBoundingClientRect();

            textSpan.fontSize = style.fontSize;

            textSpan.boundingBox = {
                left: rect.left - container.left,
                top: rect.top - container.top + fontMetrics.fontBoundingBoxAscent,
                right: rect.right - container.left,
                bottom: rect.bottom - container.top + fontMetrics.fontBoundingBoxAscent
            };
        }

        // Calculate overall baseline.

        const testContent = "";

        const firstSpan = document.createElement("span");
        firstSpan.textContent = testContent;

        working.insertAdjacentElement("afterbegin", firstSpan);

        const firstSpanStyle = window.getComputedStyle(firstSpan);

        context.font = firstSpanStyle.font;

        const firstSpanFontMetrics = context.measureText(testContent);
        const firstSpanRect = firstSpan.getBoundingClientRect();

        const overallBaseline = firstSpanRect.top - working.getBoundingClientRect().top + firstSpanFontMetrics.fontBoundingBoxAscent;

        working.remove();

        return { textSpans, overallBaseline };
    }

    #calculateBoundingBox({ textSpans, overallBaseline }) {

        const box = {
            left: Math.floor(Math.min(...textSpans.map(textSpan => textSpan.boundingBox.left))),
            top: Math.floor(Math.min(...textSpans.map(textSpan => textSpan.boundingBox.top))),
            right: Math.ceil(Math.max(...textSpans.map(textSpan => textSpan.boundingBox.right))),
            bottom: Math.ceil(Math.max(...textSpans.map(textSpan => textSpan.boundingBox.bottom))),
            baseline: overallBaseline
        }

        return box;
    }

    #toggleStyle(type) {
        this.#editArea.focus();
        document.execCommand(type);
        this.#updatePaletteButtons();
    }

    #documentFocusInOut(event) {

        if (!this.#editArea.isConnected) {
            this.#removeEvents();
            return;
        }

        const nextElement = event.type === "focusin" ? event.target : event.relatedTarget;

        const hidden = (nextElement === null) ||
            !(nextElement === this.#editArea || this.#commandPalette.contains(nextElement) || this.#symbolPopover.contains(nextElement))

        this.#commandPalette.hidden = hidden;

        if (hidden) {
            if (this.#symbolSelector) {
                this.#symbolSelector.hidePopover();
            }
        }
    }

    #updatePaletteButtons() {

        for (const styleTag in styleTags) {

            const button = this.#commandPalette.querySelector(`button.${styleTag}Button`);

            if (document.queryCommandState(styleTag)) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        }
    }

    #updateEmptyClass() {

        for (const br of this.#editArea.querySelectorAll("br")) {
            br.remove();
        }

        if (this.#editArea.textContent.trim() === "") {
            this.#editArea.classList.add("empty");
        } else {
            this.#editArea.classList.remove("empty");
        }
    }

    #editAreaBeforeInput(event) {

        if (!this.#editArea.isConnected) {
            removeEvents();
            return;
        }

        if (event.inputType === "insertParagraph") {
            event.preventDefault();
        }
    }

    #editAreaKeyDown(event) {

        if (!this.#editArea.isConnected) {
            this.#removeEvents();
            return;
        }

        if (event.ctrlKey) {

            switch (event.key) {

                case "u":
                    event.preventDefault();
                    this.#toggleStyle("underline");
                    break;

                case "i":
                    event.preventDefault();
                    this.#toggleStyle("italic");
                    break;

                case "b":
                    event.preventDefault();
                    this.#toggleStyle("bold");
                    break;
            }
        }
    }

    #insertSymbol(element) {

        this.#symbolSelector.hidePopover();
        this.#editArea.focus();
        document.execCommand("insertText", false, element.textContent);
    }

    #removeEvents() {

        this.#observer.disconnect();

        for (const eventHandler of this.#eventHandlers) {
            eventHandler.object.removeEventListener(eventHandler.type, eventHandler.function);
        }

        this.#eventHandlers = [];
    }

    #addEvents() {

        this.#observer.observe(this.#editArea, { subtree: true, childList: true, characterData: true });

        this.#eventHandlers = [
            {
                object: this.#editArea,
                type: "beforeinput",
                function: (event) => this.#editAreaBeforeInput(event)
            },
            {
                object: this.#editArea,
                type: "keydown",
                function: (event) => this.#editAreaKeyDown(event)
            },
            {
                object: document,
                type: "focusout",
                function: (event) => this.#documentFocusInOut(event)
            },
            {
                object: document,
                type: "focusin",
                function: (event) => this.#documentFocusInOut(event)
            },
            {
                object: document,
                type: "selectionchange",
                function: (event) => this.#updatePaletteButtons(event)
            },
            {
                object: document,
                type: "keyup",
                function: (event) => this.#updatePaletteButtons(event)
            },
            {
                object: this.#commandPalette.querySelector("button.boldButton"),
                type: "click",
                function: (event) => this.#toggleStyle("bold")
            },
            {
                object: this.#commandPalette.querySelector("button.italicButton"),
                type: "click",
                function: (event) => this.#toggleStyle("italic")
            },
            {
                object: this.#commandPalette.querySelector("button.underlineButton"),
                type: "click",
                function: (event) => this.#toggleStyle("underline")
            },
            {
                object: this.#commandPalette.querySelector("button.superscriptButton"),
                type: "click",
                function: (event) => this.#toggleStyle("superscript")
            },
            {
                object: this.#commandPalette.querySelector("button.subscriptButton"),
                type: "click",
                function: (event) => this.#toggleStyle("subscript")
            },
        ];

        for (const symbol of this.#symbolPopover.querySelectorAll("div.symbolSelector button")) {

            this.#eventHandlers.push({
                object: symbol,
                type: "click",
                function: () => this.#insertSymbol(symbol)
            });
        }

        for (const eventHandler of this.#eventHandlers) {
            eventHandler.object.addEventListener(eventHandler.type, eventHandler.function);
        }

        this.#commandPalette.hidden = true;

        this.#editArea.setAttribute("contenteditable", true);
    }

    constructor({ element, initialValue }) {

        this.#editArea = element;

        // Create the command palette.

        this.#commandPalette = document.createElement("div");

        this.#commandPalette.classList.add("formattedEditorPalette");
        this.#commandPalette.innerHTML = paletteMarkup;
        this.#commandPalette.hidden = true;

        this.#symbolPopover = document.createElement("div");

        this.#symbolPopover.innerHTML = symbolPopoverMarkup;

        this.#editArea.classList.add("formattedTextEditor");

        this.#editArea.insertAdjacentElement("beforebegin", this.#commandPalette);
        this.#editArea.insertAdjacentElement("beforebegin", this.#symbolPopover);

        if (initialValue !== undefined) {
            this.#editArea.innerHTML = initialValue;
        }

        this.#observer = new MutationObserver(() => this.#updateEmptyClass());

        const symbolPopoverId = `popover-${crypto.randomUUID()}`;

        this.#commandPalette.querySelector("button.insertSymbolButton").setAttribute("popovertarget", symbolPopoverId);
        this.#symbolPopover.querySelector("div.symbolPopover").setAttribute("id", symbolPopoverId);

        this.#symbolSelector = this.#symbolPopover.querySelector("div.symbolPopover");

        this.#addEvents();

        this.#updateEmptyClass();
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
            text.setAttribute("y", yOffset + textSpan.boundingBox.top);
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
        }
    }

    getBoundingBox({ fontFamily, fontSize }) {

        const { textSpans, overallBaseline } = this.#generateCopy({ fontFamily, fontSize });

        return this.#calculateBoundingBox({ textSpans, overallBaseline });
    }
}
