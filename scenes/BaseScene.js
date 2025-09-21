/**
 * Represents the base class for all scenes in the application.
 * It defines the common interface that the main app manager expects.
 */
export default class BaseScene {
    /**
     * @param {HTMLCanvasElement} canvas The main canvas element.
     * @param {CanvasRenderingContext2D} ctx The 2D rendering context of the canvas.
     * @param {Object} elements A collection of required DOM elements for the scene.
     */
    constructor(canvas, ctx, elements) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.elements = elements;
        this.isGameOver = false;
    }

    // Called once to set up the scene, add event listeners, etc.
    init() {
        throw new Error("Scene must implement init() method.");
    }

    // Called on every frame by the main animation loop.
    update(timestamp, stars) {
        throw new Error("Scene must implement update() method.");
    }

    // Called when switching to a new scene to clean up resources.
    destroy() {
        throw new Error("Scene must implement destroy() method.");
    }
}