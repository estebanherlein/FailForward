/**
 * A utility class to create and manage the DOM element for a celestial body.
 */
export default class CelestialBody {
    /**
     * @param {string[]} classList An array of CSS classes to apply to the element.
     * @param {HTMLElement} container The parent container to append this body to.
     */
    constructor(classList, container) {
        this.element = document.createElement('div');
        this.element.classList.add(...classList);
        this.container = container;

        const effectsDiv = document.createElement('div');
        effectsDiv.classList.add('black-hole-effects');
        this.element.appendChild(effectsDiv);

        this.container.appendChild(this.element);
    }

    /**
     * Returns the DOM element for this celestial body.
     */
    getElement() {
        return this.element;
    }

    /**
     * Removes the element from the DOM.
     */
    destroy() {
        if (this.element && this.container.contains(this.element)) {
            this.container.removeChild(this.element);
        }
    }
}