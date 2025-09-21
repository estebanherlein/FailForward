import DauntlessScene from '../scenes/DauntlessScene.js';
import { addLog, playAudio, showScreen } from '../script.js';
import { ASSETS } from '../config.js';

const mockElements = {
    celestialContainer: { style: {}, appendChild: jest.fn(), removeChild: jest.fn(), contains: jest.fn() },
    startButton: { addEventListener: jest.fn(), removeEventListener: jest.fn() },
    introScreenDauntless: { classList: { add: jest.fn() }, style: {}, addEventListener: jest.fn() },
    uiPanel: { style: {} },
    timerEl: { textContent: '' },
    choicePanel: { style: {}, querySelectorAll: jest.fn(() => []) },
    cockpit: { classList: { add: jest.fn(), remove: jest.fn() } },
    gameOverScreen: { style: {} },
    backgroundMusic: { pause: jest.fn(), play: jest.fn() },
    engineHum: { pause: jest.fn(), play: jest.fn() },
};

jest.mock('../script.js', () => ({
    playAudio: jest.fn(() => Promise.resolve()),
    addLog: jest.fn(),
    showScreen: jest.fn(),
}));

const mockCtx = {
    clearRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fillText: jest.fn(),
};

const mockCanvas = {
    width: 1920,
    height: 1080,
};

describe('DauntlessScene', () => {
    let scene;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();

        const logEl = document.createElement('div');
        logEl.id = 'log';
        document.body.appendChild(logEl);

        scene = new DauntlessScene(mockCanvas, mockCtx, mockElements);

        const mockSun = {
            getElement: () => ({ classList: { add: jest.fn() }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }) }),
            destroy: jest.fn()
        };
        scene.redGiant = mockSun;
        scene.yellowDwarf = mockSun;

        scene.simulationStarted = true;
    });

    test('should initialize with correct default state', () => {
        const freshScene = new DauntlessScene(mockCanvas, mockCtx, mockElements);
        expect(freshScene.isGameOver).toBe(false);
        expect(freshScene.time).toBe(0);
        expect(freshScene.anomalyOccurred).toBe(false);
        expect(freshScene.hudFailureStage).toBe(0);
        expect(freshScene.choiceShown).toBe(false);
    });

    test('should set up correctly on start', () => {
        const sceneToStart = new DauntlessScene(mockCanvas, mockCtx, mockElements);
        sceneToStart.start();

        expect(sceneToStart.simulationStarted).toBe(true);
        expect(mockElements.cockpit.classList.add).toHaveBeenCalledWith('cockpit-dauntless');
        expect(mockElements.uiPanel.style.display).toBe('block');
        expect(mockElements.backgroundMusic.play).toHaveBeenCalled();
        expect(mockElements.engineHum.play).toHaveBeenCalled();
        expect(playAudio).toHaveBeenCalledWith(ASSETS.AUDIO.SCENE_START);
        expect(mockElements.celestialContainer.appendChild).toHaveBeenCalledTimes(2);
    });

    test('should trigger anomaly event at CRITICAL_EVENT_TIME', () => {
        jest.useFakeTimers();
        scene.time = 49;
        scene.update(performance.now(), []);

        expect(scene.anomalyOccurred).toBe(true);
        expect(playAudio).toHaveBeenCalledWith(ASSETS.AUDIO.STAR_COLLAPSE);

        expect(scene.hudFailureStage).toBe(0);
        jest.advanceTimersByTime(200);
        expect(scene.hudFailureStage).toBe(1);
        jest.advanceTimersByTime(200);
        expect(scene.hudFailureStage).toBe(2);
        jest.advanceTimersByTime(200);
        expect(scene.hudFailureStage).toBe(3);
    });

    test('should show and disable the choice panel correctly', () => {
        jest.useFakeTimers();
        const mockButton = { disabled: false, style: { cursor: '', opacity: '' } };
        mockElements.choicePanel.querySelectorAll.mockReturnValue([mockButton]);

        scene.anomalyOccurred = true;
        scene.time = 47;
        scene.update(performance.now(), []);

        expect(scene.choiceShown).toBe(true);
        expect(mockElements.choicePanel.style.display).toBe('block');

        jest.advanceTimersByTime(400);

        expect(mockButton.disabled).toBe(true);
        expect(mockButton.style.cursor).toBe('not-allowed');
    });

    test('should trigger game over sequence at END_TIME', () => {
        jest.useFakeTimers();
        scene.time = 66;
        scene.update(performance.now(), []);

        expect(scene.isGameOver).toBe(true);
        expect(mockElements.cockpit.classList.add).toHaveBeenCalledWith('is-ending');
        expect(mockElements.uiPanel.style.display).toBe('none');

        jest.advanceTimersByTime(3000);
        expect(mockElements.gameOverScreen.style.display).toBe('flex');
    });

    test('should clean up correctly on destroy', () => {
        scene.destroy();

        expect(mockElements.startButton.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));

        expect(mockElements.uiPanel.style.display).toBe('none');
        expect(mockElements.cockpit.classList.remove).toHaveBeenCalledWith('is-ending');
        expect(mockElements.cockpit.classList.remove).toHaveBeenCalledWith('cockpit-dauntless');
        expect(mockElements.choicePanel.style.display).toBe('none');

        expect(scene.redGiant.destroy).toHaveBeenCalled();
        expect(scene.yellowDwarf.destroy).toHaveBeenCalled();
    });
});