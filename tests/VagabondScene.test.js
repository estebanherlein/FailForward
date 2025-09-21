import VagabondScene from '../scenes/VagabondScene.js';
import { addLog, playAudio, showScreen } from '../script.js';
import { ASSETS } from '../config.js';

const mockElements = {
    celestialContainer: { style: {}, appendChild: jest.fn(), removeChild: jest.fn(), contains: jest.fn() },
    choicePanel: { style: {} },
    atlasChoice: { style: {}, addEventListener: jest.fn(), removeEventListener: jest.fn() },
    evaChoice: { style: {}, addEventListener: jest.fn(), removeEventListener: jest.fn() },
    startButton: { addEventListener: jest.fn(), removeEventListener: jest.fn() },
    introScreen: { classList: { add: jest.fn() }, style: {}, addEventListener: jest.fn() },
    uiPanel: { style: {} },
    timerEl: { textContent: '' },
    cockpit: { classList: { add: jest.fn(), remove: jest.fn() } },
    gameOverScreen: { style: {} },
    collapseNebula: { classList: { add: jest.fn() }, style: {} },
    engineHum: { pause: jest.fn(), play: jest.fn() },
    backgroundMusic: { pause: jest.fn(), play: jest.fn() },
};

jest.mock('../script.js', () => ({
    playAudio: jest.fn(() => Promise.resolve()), // Ensure it returns a resolved promise
    addLog: jest.fn(),
    showScreen: jest.fn(),
}));

const mockCtx = {
    clearRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    setLineDash: jest.fn(),
};

const mockCanvas = {
    width: 1920,
    height: 1080,
};

describe('VagabondScene', () => {
    let scene;

    beforeEach(() => {
        jest.clearAllMocks();

        const logEl = document.createElement('div');
        logEl.id = 'log';
        document.body.appendChild(logEl);

        scene = new VagabondScene(mockCanvas, mockCtx, mockElements);
        scene.simulationStarted = true;
        scene.sun = {
            getElement: () => ({ classList: { add: jest.fn() }, style: {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }) }),
            destroy: jest.fn()
        };
    });

    test('should initialize with correct default state', () => {
        const freshScene = new VagabondScene(mockCanvas, mockCtx, mockElements);
        expect(freshScene.isGameOver).toBe(false);
        expect(freshScene.time).toBe(0);
        expect(freshScene.isSunDying).toBe(false);
        expect(freshScene.trajectoriesVisible).toBe(false);
    });

    test('should set up correctly on start', () => {
        const sceneToStart = new VagabondScene(mockCanvas, mockCtx, mockElements);
        sceneToStart.start();

        expect(sceneToStart.simulationStarted).toBe(true);
        expect(mockElements.cockpit.classList.add).toHaveBeenCalledWith('cockpit-vagabond');
        expect(mockElements.uiPanel.style.display).toBe('block');
        expect(playAudio).toHaveBeenCalledWith(ASSETS.AUDIO.SCENE_START);
        expect(mockElements.backgroundMusic.play).toHaveBeenCalled();
    });

    test('should set isSunDying to true at DYING_STAR_TIME', () => {
        scene.time = 30;
        scene.update(performance.now(), []);

        expect(scene.isSunDying).toBe(true);
        expect(scene.trajectoriesVisible).toBe(true);
        expect(mockElements.choicePanel.style.display).toBe('block');
    });

    test('should not be game over before END_TIME', () => {
        scene.time = 59;
        scene.update(performance.now(), []);

        expect(scene.isGameOver).toBe(false);
    });

    test('should trigger game over sequence at END_TIME', () => {
        jest.useFakeTimers();

        scene.time = 60;
        scene.update(performance.now(), []);

        expect(scene.isGameOver).toBe(false);

        jest.advanceTimersByTime(3000);

        expect(scene.isGameOver).toBe(true);
        expect(mockElements.gameOverScreen.style.display).toBe('flex');

        jest.useRealTimers();
    });

    test('should handle Eva choice correctly', async () => {
        scene.trajectoriesVisible = true;

        await scene.handleEvaChoice();

        expect(scene.evaPathChosen).toBe(true);
        expect(scene.choiceMade).toBe(true);

        expect(addLog).toHaveBeenCalledWith('Adjusting vector to 0.005%.', 'ROSTOVA');
        expect(addLog).toHaveBeenCalledWith('Warning: vector approaches hull distortion limit. Success probability reduced to 14.1%.', 'ATLAS');
        expect(playAudio).toHaveBeenCalledWith(ASSETS.AUDIO.ROSTOVA_3);
        expect(playAudio).toHaveBeenCalledWith(ASSETS.AUDIO.ATLAS_4);
    });

    test('should handle Atlas "fake" choice correctly', async () => {
        scene.trajectoriesVisible = true;

        await scene.handleAtlasChoice();

        expect(addLog).toHaveBeenCalledWith("Negative, Atlas. That maneuver is too risky. I'm taking manual control.", 'ROSTOVA');
        expect(playAudio).toHaveBeenCalledWith(ASSETS.AUDIO.ROSTOVA_OVERRIDE);

        expect(scene.choiceMade).toBe(false);
        expect(scene.evaPathChosen).toBe(false);
        expect(mockElements.atlasChoice.style.opacity).toBe('0.5');
    });

    test('should not allow a second choice to be made', async () => {
        scene.trajectoriesVisible = true;

        await scene.handleEvaChoice();
        await scene.handleAtlasChoice();

        expect(addLog).not.toHaveBeenCalledWith("Negative, Atlas. That maneuver is too risky. I'm taking manual control.", 'ROSTOVA');
    });

    test('should clean up correctly on destroy', () => {
        scene.destroy();

        expect(mockElements.startButton.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        expect(mockElements.atlasChoice.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        expect(mockElements.evaChoice.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));

        expect(mockElements.uiPanel.style.display).toBe('none');
        expect(mockElements.cockpit.classList.remove).toHaveBeenCalledWith('is-ending');
    });
});