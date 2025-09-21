import VagabondScene from './scenes/VagabondScene.js';
import DauntlessScene from './scenes/DauntlessScene.js';
import { ASSETS, MUSIC_VOLUME } from './config.js';

const canvas = document.querySelector('.stars');
const ctx = canvas.getContext('2d');
const logEl = document.getElementById('log');
const titleScreen = document.getElementById('titleScreen');
const sceneSelectScreen = document.getElementById('sceneSelectScreen');
const backgroundMusic = document.getElementById('backgroundMusic');
const enterButton = document.getElementById('enterButton');
const sceneSelectButtons = document.querySelectorAll('.scene-select-button');

let activeScene = null;
let stars = [];
let lastTime = 0;
let animationFrameId = null;
let audioAssets = {};

const STAR_COUNT = 200;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initStars();
}

function initStars() {
  stars = [];
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5,
      speed: Math.random() * 2 + 0.5,
      angle: Math.atan2(Math.random() * canvas.height - centerY, Math.random() * canvas.width - centerX),
    });
  }
}

/**
 * Adds a new entry to the log panel.
 * @param {string} message The message to log.
 * @param {string} source The source of the message (e.g., 'ATLAS', 'ROSTOVA').
 */
export function addLog(message, source = 'SYSTEM') {
  const entry = document.createElement('div');
  entry.innerHTML = `<strong>[${source}]:</strong> ${message}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function preloadAudio() {
    for (const key in ASSETS.AUDIO) {
        const path = ASSETS.AUDIO[key];
        audioAssets[path] = new Audio(path);
    }
}

/**
 * Plays a one-shot audio file, returning a promise that resolves when the audio finishes.
 * @param {string} src Path to the audio file.
 */
export function playAudio(src) {
    const isVoiceLine = src.includes('atlas') || src.includes('rostova');

    return new Promise((resolve) => {
        const audio = audioAssets[src];
        if (!audio) {
            console.error(`Audio asset not found or preloaded: ${src}`);
            return resolve();
        }

        if (isVoiceLine && backgroundMusic) {
            backgroundMusic.volume = 0;
        }

        const onEnd = () => {
            audio.removeEventListener('ended', onEnd);
            if (isVoiceLine && backgroundMusic) {
                backgroundMusic.volume = MUSIC_VOLUME;
            }
            resolve();
        };
        audio.addEventListener('ended', onEnd);

        audio.currentTime = 0;
        audio.play().catch(error => {
            console.error(`Error playing audio "${src}":`, error);
            audio.removeEventListener('ended', onEnd);
            if (isVoiceLine && backgroundMusic) {
                backgroundMusic.volume = MUSIC_VOLUME;
            }
            resolve();
        });
    });
}

/**
 * The main animation loop, called on every frame.
 * @param {number} timestamp The current time provided by requestAnimationFrame.
 */
function animate(timestamp) {
    lastTime = timestamp;

    if (activeScene && !activeScene.isGameOver) {
        activeScene.update(timestamp, stars);
    }
    animationFrameId = requestAnimationFrame(animate);
}

export function showScreen(screenElement) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    if (screenElement) {
        screenElement.style.display = 'flex';
    }
}

function initializeScene(sceneId) {
    if (activeScene) {
        activeScene.destroy();
        activeScene = null;
    }

    sceneSelectScreen.classList.add('hidden');
    sceneSelectScreen.addEventListener('transitionend', () => {
        sceneSelectScreen.style.display = 'none';
        if (sceneId === '1') {
            const sceneElements = {
                celestialContainer: document.getElementById('celestial-container'),
                sun: document.getElementById('sun'),
                choicePanel: document.getElementById('choicePanel'),
                atlasChoice: document.getElementById('atlasChoice'),
                evaChoice: document.getElementById('evaChoice'),
                startButton: document.getElementById('startButton'),
                introScreen: document.getElementById('introScreen'),
                uiPanel: document.querySelector('.ui'),
                timerEl: document.getElementById('timer'),
                cockpit: document.querySelector('.cockpit'),
                gameOverScreen: document.getElementById('gameOverScreen'),
                collapseNebula: document.getElementById('collapseNebula'),
                engineHum: document.getElementById('engineHum'),
                backgroundMusic: document.getElementById('backgroundMusic'),
            };
            activeScene = new VagabondScene(canvas, ctx, sceneElements);
            activeScene.init();
        }
        else if (sceneId === '3') {
          const sceneElements = {
            celestialContainer: document.getElementById('celestial-container'),
            yellowDwarf: document.getElementById('yellowDwarf'),
            startButton: document.getElementById('startButtonDauntless'),
            introScreenDauntless: document.getElementById('introScreenDauntless'),
            uiPanel: document.querySelector('.ui'),
            timerEl: document.getElementById('timer'),
            choicePanel: document.getElementById('choicePanelDauntless'),
            cockpit: document.querySelector('.cockpit'),
            gameOverScreen: document.getElementById('gameOverScreenDauntless'),
            backgroundMusic: document.getElementById('backgroundMusic'),
            engineHum: document.getElementById('engineHum'),
          };
          activeScene = new DauntlessScene(canvas, ctx, sceneElements);
          activeScene.init();
        }
    }, { once: true });
}

enterButton.addEventListener('click', () => {
    titleScreen.classList.add('hidden');
    titleScreen.addEventListener('transitionend', () => {
        showScreen(sceneSelectScreen);
    }, { once: true });
});

sceneSelectButtons.forEach(button => {
    button.addEventListener('click', () => initializeScene(button.dataset.scene));
});

window.addEventListener('resize', resizeCanvas);

function main() {
    preloadAudio();
    resizeCanvas();
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
    showScreen(titleScreen);
}

main();