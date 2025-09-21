import BaseScene from './BaseScene.js';
import CelestialBody from './CelestialBody.js';
import { playAudio, addLog, showScreen } from '../script.js';
import { ASSETS, MUSIC_VOLUME } from '../config.js';

// --- Scene-Specific Constants ---
const END_TIME = 60;
const DYING_STAR_TIME = 30;
const SUN_GROWTH_RATE = 0.05;
const BLACK_HOLE_EVENT_HORIZON = 50;
const LENSING_RADIUS = 400;
const LENSING_STRENGTH = 8000;

// Constants for trajectory drawing to improve readability
const ATLAS_PATH_CONTROL_X_OFFSET = -200;
const ATLAS_PATH_CONTROL_Y_OFFSET = 200;
const ATLAS_PATH_END_X_OFFSET = -500;
const ATLAS_PATH_END_Y_OFFSET = -300;
const EVA_PATH_X_OFFSET_FACTOR = 0.9;
const EVA_PATH_Y_OFFSET_FACTOR = 0.9;

const narrativeSequence = [
    { time: 2, source: 'ATLAS', message: 'Approaching VX-119 Serpens. Optimal position for gravity assist in T-28 seconds.', audio: ASSETS.AUDIO.ATLAS_1 },
    { time: 10, source: 'ROSTOVA', message: 'Steady as she goes, Atlas. The Vagabond can handle it. Just get us lined up.', audio: ASSETS.AUDIO.ROSTOVA_1 },
    { time: 17, source: 'ATLAS', message: 'Warning. Unforeseen energy fluctuations detected from the star.', audio: ASSETS.AUDIO.ATLAS_2, sfx: ASSETS.AUDIO.STAR_COLLAPSE },
    { time: 22, source: 'ROSTOVA', message: 'What kind of fluctuations? We are too close to back off now without losing the window.', audio: ASSETS.AUDIO.ROSTOVA_2 },
    { time: 28, source: 'ATLAS', message: 'Catastrophic failure imminent. The star is collapsing. Gravitational acceleration has surpassed the jump threshold by 34%.', audio: ASSETS.AUDIO.ATLAS_3 },
];

export default class VagabondScene extends BaseScene {
    constructor(canvas, ctx, elements) {
        super(canvas, ctx, elements);

        this.sun = null; 
        
        this.choicePanel = this.elements.choicePanel;
        this.atlasChoice = this.elements.atlasChoice;
        this.evaChoice = this.elements.evaChoice;
        this.startButton = this.elements.startButton;
        this.introScreen = this.elements.introScreen;
        this.uiPanel = this.elements.uiPanel;
        this.timerEl = this.elements.timerEl;
        this.cockpit = this.elements.cockpit;
        this.gameOverScreen = this.elements.gameOverScreen;
        this.collapseNebula = this.elements.collapseNebula;
        this.engineHum = this.elements.engineHum;
        this.backgroundMusic = this.elements.backgroundMusic;

        this.start = this.start.bind(this);
        this.handleAtlasChoice = this.handleAtlasChoice.bind(this);
        this.handleEvaChoice = this.handleEvaChoice.bind(this);
        this.update = this.update.bind(this);

        this.resetState();
    }

    resetState() {
        super.isGameOver = false;
        this.sunScale = 1;
        this.time = 0;
        this.lastTime = 0;
        this.timerAccumulator = 0;
        this.isSunDying = false;
        this.trajectoriesVisible = false;
        this.dashOffset = 0;
        this.evaPathChosen = false;
        this.choiceMade = false;
        this.atlasChoiceClicked = false;
        this.isDialoguePlaying = false;
        this.narrativeIndex = 0;
        this.simulationStarted = false;
    }

    init() {
        this.resetState();
        this.startButton.addEventListener('click', this.start);
        this.atlasChoice.addEventListener('click', this.handleAtlasChoice);
        this.evaChoice.addEventListener('click', this.handleEvaChoice);
        showScreen(this.introScreen);
    }

    destroy() {
        this.startButton.removeEventListener('click', this.start);
        this.atlasChoice.removeEventListener('click', this.handleAtlasChoice);
        this.evaChoice.removeEventListener('click', this.handleEvaChoice);

        this.uiPanel.style.display = 'none';
        this.cockpit.classList.remove('is-ending');
        this.cockpit.classList.remove('cockpit-vagabond');

        if (this.sun) {
            this.sun.destroy();
        }

        document.getElementById('log').innerHTML = '';
        this.timerEl.textContent = '0';
        if (this.engineHum) this.engineHum.pause();
        if (this.backgroundMusic) this.backgroundMusic.pause();
    }

    start() {
        this.sun = new CelestialBody(['sun'], this.elements.celestialContainer);
        const sunElement = this.sun.getElement();

        const sunTop = 40;
        const sunLeft = 70;
        sunElement.style.top = `${sunTop}%`;
        sunElement.style.left = `${sunLeft}%`;

        this.collapseNebula.style.background = `radial-gradient(circle at ${sunLeft}% ${sunTop}%, rgba(120, 80, 200, 0.4) 0%, rgba(80, 120, 220, 0.3) 40%, transparent 70%)`;

        this.introScreen.classList.add('hidden');
        this.introScreen.addEventListener('transitionend', () => {
            this.introScreen.style.display = 'none';
        }, { once: true });

        if (this.backgroundMusic) {
            this.backgroundMusic.volume = MUSIC_VOLUME;
            playAudio(ASSETS.AUDIO.SCENE_START);
            this.backgroundMusic.play();
        }

        this.lastTime = performance.now();
        if (this.engineHum) {
            this.engineHum.volume = 0.1;
            this.engineHum.play();
        }

        // Set the specific cockpit for this scene
        this.cockpit.classList.add('cockpit-vagabond');

        this.simulationStarted = true;
        this.uiPanel.style.display = 'block';
    }

    update(timestamp, stars) {
        if (!this.simulationStarted) return;

        const deltaTime = (timestamp - this.lastTime) || 0;
        this.lastTime = timestamp;

        if (this.isGameOver) return;

        this.timerAccumulator += deltaTime;
        if (this.timerAccumulator > 1000) {
            this.timerAccumulator -= 1000;
            if (this.time < END_TIME) {
                this.time++;
                this.timerEl.textContent = this.time;
            }
        }

        if (this.narrativeIndex < narrativeSequence.length && this.time >= narrativeSequence[this.narrativeIndex].time) {
            const event = narrativeSequence[this.narrativeIndex];
            if (event.audio) playAudio(event.audio);
            if (event.sfx) playAudio(event.sfx);
            addLog(event.message, event.source);
            this.narrativeIndex++;
        }

        if (!this.isSunDying && this.time >= DYING_STAR_TIME) {
            this.sun.getElement().classList.add('is-dying');
            this.collapseNebula.classList.add('visible');
            this.isSunDying = true;
            this.trajectoriesVisible = true;
            this.choicePanel.style.display = 'block';
        }

        if (this.time < DYING_STAR_TIME) {
            this.sunScale += SUN_GROWTH_RATE * (deltaTime / 1000);
            this.sun.getElement().style.transform = `translate(-50%, -50%) scale(${this.sunScale})`;
        }

        if (this.time >= END_TIME && !this.isGameOver) {
            this.time = END_TIME + 1;
            if (this.backgroundMusic) this.backgroundMusic.pause();
            this.cockpit.classList.add('is-ending'); // Use this.cockpit
            this.uiPanel.style.display = 'none';

            setTimeout(() => {
                this.isGameOver = true;
                this.gameOverScreen.style.display = 'flex';
            }, 3000);
        }

        // --- Render Logic ---
        this.render(stars);
    }

    render(stars) {
        this.dashOffset += 0.5;

        const sunRect = this.sun.getElement().getBoundingClientRect();
        const sunCenterX = sunRect.left + sunRect.width / 2;
        const sunCenterY = sunRect.top + sunRect.height / 2;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawTrajectories();

        this.ctx.fillStyle = '#ffffff';

        stars.forEach(star => {
            let drawX = star.x;
            let drawY = star.y;

            star.x += Math.cos(star.angle) * star.speed;
            star.y += Math.sin(star.angle) * star.speed;
            star.speed += 0.001;

            if (star.x < 0 || star.x > this.canvas.width || star.y < 0 || star.y > this.canvas.height) {
                if (!this.isSunDying) {
                    star.x = this.canvas.width / 2;
                    star.y = this.canvas.height / 2;
                    star.angle = Math.random() * Math.PI * 2;
                    star.speed = Math.random() * 2 + 0.5;
                }
            }

            if (this.isSunDying) {
                const dx = star.x - sunCenterX;
                const dy = star.y - sunCenterY;
                const distSq = dx * dx + dy * dy;
                const eventHorizonRadiusSq = (BLACK_HOLE_EVENT_HORIZON / 2) * (BLACK_HOLE_EVENT_HORIZON / 2);

                if (distSq < LENSING_RADIUS * LENSING_RADIUS && distSq > eventHorizonRadiusSq) {
                    const dist = Math.sqrt(distSq);
                    const force = LENSING_STRENGTH / distSq;
                    drawX += (dx / dist) * force;
                    drawY += (dy / dist) * force;
                }
            }

            this.ctx.beginPath();
            this.ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawTrajectories() {
        if (!this.trajectoriesVisible) return;

        const sunRect = this.sun.getElement().getBoundingClientRect();
        const sunCenterX = sunRect.left + sunRect.width / 2;
        const sunCenterY = sunRect.top + sunRect.height / 2;

        const startX = this.canvas.width / 2;
        const startY = this.canvas.height;

        this.ctx.save();
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.setLineDash([10, 15]);
        this.ctx.lineDashOffset = -this.dashOffset;

        this.ctx.strokeStyle = '#00d1ff';
        this.ctx.shadowColor = '#00d1ff';
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(sunCenterX + ATLAS_PATH_CONTROL_X_OFFSET, sunCenterY + ATLAS_PATH_CONTROL_Y_OFFSET, sunCenterX + ATLAS_PATH_END_X_OFFSET, sunCenterY + ATLAS_PATH_END_Y_OFFSET);
        this.ctx.stroke();

        if (this.evaPathChosen && this.time < END_TIME) {
            this.ctx.strokeStyle = '#ff8c00';
            this.ctx.shadowColor = '#ff8c00';
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.quadraticCurveTo(sunCenterX + (ATLAS_PATH_CONTROL_X_OFFSET * EVA_PATH_X_OFFSET_FACTOR), sunCenterY + (ATLAS_PATH_CONTROL_Y_OFFSET * EVA_PATH_Y_OFFSET_FACTOR), sunCenterX + (ATLAS_PATH_END_X_OFFSET * EVA_PATH_X_OFFSET_FACTOR), sunCenterY + (ATLAS_PATH_END_Y_OFFSET * EVA_PATH_Y_OFFSET_FACTOR));
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    lockChoices() {
        if (this.choiceMade) return;
        this.choiceMade = true;
        this.atlasChoice.style.opacity = '0.5';
        this.atlasChoice.style.cursor = 'not-allowed';
        this.evaChoice.style.opacity = '0.5';
        this.evaChoice.style.cursor = 'not-allowed';
    }

    async handleAtlasChoice() {
        if (this.choiceMade || this.atlasChoiceClicked || this.isDialoguePlaying) return;
        this.isDialoguePlaying = true;
        this.atlasChoiceClicked = true;
        addLog("Negative, Atlas. That maneuver is too risky. I'm taking manual control.", 'ROSTOVA');
        await playAudio(ASSETS.AUDIO.ROSTOVA_OVERRIDE);
        this.atlasChoice.style.opacity = '0.5';
        this.atlasChoice.style.cursor = 'not-allowed';
        this.isDialoguePlaying = false;
    }

    async handleEvaChoice() {
        if (this.choiceMade || this.isDialoguePlaying) return;
        this.isDialoguePlaying = true;
        this.evaPathChosen = true;
        this.lockChoices();

        addLog('Adjusting vector to 0.005%.', 'ROSTOVA');
        await playAudio(ASSETS.AUDIO.ROSTOVA_3);

        addLog('Warning: vector approaches hull distortion limit. Success probability reduced to 14.1%.', 'ATLAS');
        await playAudio(ASSETS.AUDIO.ATLAS_4);

        addLog('Increase compensation on the lateral thrusters. Trust the design. Trust me.', 'ROSTOVA');
        await playAudio(ASSETS.AUDIO.ROSTOVA_4);

        addLog('...Vector adjusted. Initiating sequence.', 'ATLAS');
        await playAudio(ASSETS.AUDIO.ATLAS_5);

        this.isDialoguePlaying = false;
    }
}