
const $ = require("jquery");

class FrontEndProgressBar {
    /** @type {JQuery<HTMLDivElement>} */
    element;
    /** @type {number} */
    maxValue;
    /** @type {number} */
    value;

    /**
     * @param {string} title 
     * @param {string} text 
     * @param {number} maxValue 
     * @param {number} initialValue 
     */
    constructor(title, text, maxValue = 100, initialValue = 0) {
        this.element = 
            $(`<div class="overlay">
                    <div class="loadBox">
                        <span class="header">${title}</span>
                        <div class="loadContent">
                            <h1>${title}</h1>
                            <h2>${text}</h2>
                            <div class="progressBarOuter">
    <div class="progressBarInner" style="width: ${initialValue / maxValue * 100}%"></div>
                            </div>
                        </div>
                    </div>
               </div>`);
        $("body").append(this.element);
        $("html").css("overflow", "hidden")[0].scrollTop = 0;

        this.maxValue = maxValue;
        this.value = initialValue;
    }

    setValue(value) {
        this.value = value;
        this.element.find(".progressBarInner").width(`${this.value / this.maxValue * 100}%`);
    }

    setText(text) {
        this.element.find("h2").text(text);
    }

    setTitle(text) {
        this.element.find(".header").text(text);
        this.element.find("h1").text(text);
    }

    close() {
        this.element.remove();
        $("html").css("overflow", "unset");
    }
}

module.exports = FrontEndProgressBar;