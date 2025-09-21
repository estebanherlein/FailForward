import BaseScene from '../scenes/BaseScene.js';
import { addLog, playAudio } from '../script.js';

// Mock the global script functions
jest.mock('../script.js', () => ({
    playAudio: jest.fn(() => Promise.resolve()),
    addLog: jest.fn(),
    showScreen: jest.fn(),
}));

// Mock for the canvas 2D rendering context
const mockCtx = {
    clearRect: jest.fn(),
};

// Mock for the canvas element
const mockCanvas = {
    width: 1920,
    height: 1080,
};

const mockElements = {
    timerEl: { textContent: '' },
};

class TestableScene extends BaseScene {
    constructor(canvas, ctx, elements, narrative = [], endTime = 60) {
        super(canvas, ctx, elements);
        this.timerEl = this.elements.timerEl;
        this.narrativeSequence = narrative;
        this.END_TIME = endTime;
        this.time = 0;
        this.narrativeIndex = 0;
        this.timerAccumulator = 0;
        this.lastTime = 0;
        this.simulationStarted = true;
    }

    update(timestamp) {
        if (this.isGameOver) return;

        const deltaTime = (timestamp - this.lastTime) || 0;
        this.lastTime = timestamp;

        this.timerAccumulator += deltaTime;
        while (this.timerAccumulator > 1000) {
            this.timerAccumulator -= 1000;
            if (this.time < this.END_TIME) {
                this.time++;
                this.timerEl.textContent = String(this.time);
            }
        }

        if (this.narrativeIndex < this.narrativeSequence.length && this.time >= this.narrativeSequence[this.narrativeIndex].time) {
            const event = this.narrativeSequence[this.narrativeIndex];
            addLog(event.message, event.source);
            if (event.audio) playAudio(event.audio);
            this.narrativeIndex++;
        }
    }
}

describe('BaseScene', () => {
    let scene;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should increment timer correctly', () => {
        scene = new TestableScene(mockCanvas, mockCtx, mockElements);
        scene.lastTime = performance.now();

        scene.update(performance.now() + 2001);

        expect(scene.time).toBe(2);
        expect(mockElements.timerEl.textContent).toBe('2');
    });

    test('should process narrative sequence based on time', () => {
        const testNarrative = [
            { time: 1, source: 'TEST', message: 'First message' },
            { time: 3, source: 'TEST', message: 'Second message' }
        ];
        scene = new TestableScene(mockCanvas, mockCtx, mockElements, testNarrative);

        scene.time = 1;
        scene.update(performance.now());
        expect(addLog).toHaveBeenCalledWith('First message', 'TEST');
        expect(addLog).toHaveBeenCalledTimes(1);

        scene.time = 2;
        scene.update(performance.now());
        expect(addLog).toHaveBeenCalledTimes(1);

        scene.time = 3;
        scene.update(performance.now());
        expect(addLog).toHaveBeenCalledWith('Second message', 'TEST');
        expect(addLog).toHaveBeenCalledTimes(2);
    });
});