import BaseScene from './BaseScene.js';
import CelestialBody from './CelestialBody.js';
import { playAudio, addLog, showScreen } from '../script.js';
import { ASSETS, MUSIC_VOLUME } from '../config.js';

// --- Scene-Specific Constants ---
const END_TIME = 66;
const CRITICAL_EVENT_TIME = 49;

const narrativeSequence = [
  { time: 2, source: 'ATLAS', message: 'Captain Sharma, entering designated zone. Primary star is a red giant in early-stage collapse.', audio: ASSETS.AUDIO.DAUNTLESS_ATLAS_1 },
  { time: 9, source: 'ATLAS', message: 'The secondary yellow dwarf creates a narrow gravitational corridor. Your HUD is augmented with real-time escape vectors.', audio: ASSETS.AUDIO.DAUNTLESS_ATLAS_2 },
  { time: 17, source: 'SHARMA', message: 'Acknowledged, Atlas. The augmentation feels... responsive. It’s like you’re anticipating my every move.', audio: ASSETS.AUDIO.DAUNTLESS_SHARMA_1 },
  { time: 24, source: 'ATLAS', message: 'Correction: I am processing 1.2 million variables per second to provide optimal pathing. Your role is execution.', audio: ASSETS.AUDIO.DAUNTLESS_ATLAS_3 },
  { time: 32, source: 'SHARMA', message: 'Execution is what I do best. The Dauntless is holding steady. With this setup, I feel like I could fly through anything.', audio: ASSETS.AUDIO.DAUNTLESS_SHARMA_2 },
  { time: 38, source: 'ATLAS', message: 'Advisory: Gravitational harmonics fluctuating. Minor variance detected in the yellow dwarf.', audio: ASSETS.AUDIO.DAUNTLESS_ATLAS_4 },
  { time: 43, source: 'SHARMA', message: 'Noted. Feels stable on my end. Keep the line, Atlas.', audio: ASSETS.AUDIO.DAUNTLESS_SHARMA_3 },
  { time: 46, source: 'ATLAS', message: 'Critical threshold. Red giant pulsing. Initiate magnetic dispersion maneuver... now!', audio: ASSETS.AUDIO.DAUNTLESS_ATLAS_5 },
  { time: 52, source: 'ATLAS', message: 'Alert! Unexpected flare from the yellow dwarf. Trajectory compromised!', audio: ASSETS.AUDIO.DAUNTLESS_ATLAS_6 },
  { time: 56, source: 'SHARMA', message: 'Compensating... no good—controls are lagging!', audio: ASSETS.AUDIO.DAUNTLESS_SHARMA_4 },
  { time: 58, source: 'ATLAS', message: 'Impact detected. Auxiliary systems failing. Engine containment breached.', audio: ASSETS.AUDIO.DAUNTLESS_ATLAS_8 },
  { time: 63, source: 'SHARMA', message: 'Dauntless is… not responding. We’re adrift.', audio: ASSETS.AUDIO.DAUNTLESS_SHARMA_5 },
  { time: 67, source: 'ATLAS', message: 'Vessel irrecoverable. Crew survival pending external rescue.', audio: ASSETS.AUDIO.DAUNTLESS_ATLAS_9 },
];

export default class DauntlessScene extends BaseScene {
    constructor(canvas, ctx, elements) {
        super(canvas, ctx, elements);

        this.redGiant = null;
        this.yellowDwarf = null;
        this.startButton = this.elements.startButton;
        this.introScreen = this.elements.introScreenDauntless;
        this.uiPanel = this.elements.uiPanel;
        this.timerEl = this.elements.timerEl;
        this.choicePanel = this.elements.choicePanel;
        this.cockpit = this.elements.cockpit;
        this.gameOverScreen = this.elements.gameOverScreen;
        this.backgroundMusic = this.elements.backgroundMusic;
        this.engineHum = this.elements.engineHum;

        this.start = this.start.bind(this);
        this.update = this.update.bind(this);

        this.resetState();
    }

    resetState() {
        super.isGameOver = false;
        this.time = 0;
        this.lastTime = 0;
        this.timerAccumulator = 0;
        this.narrativeIndex = 0;
        this.simulationStarted = false;
        this.anomalyOccurred = false;
        this.hudFailureStage = 0;
        this.hudShutdownStage = 0;
        this.choiceShown = false;
    }

    init() {
        this.resetState();
        this.startButton.addEventListener('click', this.start);
        showScreen(this.introScreen);
    }

    destroy() {
        this.startButton.removeEventListener('click', this.start);
        this.uiPanel.style.display = 'none';
        this.cockpit.classList.remove('is-ending');
        this.choicePanel.style.display = 'none';
        this.cockpit.classList.remove('cockpit-dauntless');
        if (this.redGiant) {
            this.redGiant.destroy();
        }
        if (this.yellowDwarf) {
            this.yellowDwarf.destroy();
        }
        document.getElementById('log').innerHTML = '';
        this.timerEl.textContent = '0';
        if (this.backgroundMusic) this.backgroundMusic.pause();
        if (this.engineHum) this.engineHum.pause();
    }

    start() {
        this.redGiant = new CelestialBody(['sun-red-giant'], this.elements.celestialContainer);
        this.yellowDwarf = new CelestialBody(['sun-yellow-dwarf'], this.elements.celestialContainer);
        this.introScreen.classList.add('hidden');
        this.introScreen.addEventListener('transitionend', () => {
            this.introScreen.style.display = 'none';
        }, { once: true });

        if (this.backgroundMusic) {
            this.backgroundMusic.volume = MUSIC_VOLUME;
            this.backgroundMusic.play();
        }

        if (this.engineHum) {
            this.engineHum.volume = 0.1;
            this.engineHum.play();
        }
        playAudio(ASSETS.AUDIO.SCENE_START);

        this.cockpit.classList.add('cockpit-dauntless');

        this.lastTime = performance.now();
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
            addLog(event.message, event.source);
            if (event.audio) playAudio(event.audio);
            this.narrativeIndex++;
        }

        if (!this.anomalyOccurred && this.time >= CRITICAL_EVENT_TIME) {
            this.anomalyOccurred = true;
            this.yellowDwarf.getElement().classList.add('pulse-anomaly');
            playAudio(ASSETS.AUDIO.STAR_COLLAPSE);

            setTimeout(() => { this.hudFailureStage = 1; }, 200); // Paths turn red
            setTimeout(() => { this.hudFailureStage = 2; }, 400); // Left data turns red
            setTimeout(() => { this.hudFailureStage = 3; }, 600); // Right data turns red
        }

        if (this.anomalyOccurred && !this.choiceShown && this.time >= 47) {
            this.choiceShown = true;
            this.choicePanel.style.display = 'block';

            setTimeout(() => {
                this.choicePanel.querySelectorAll('button').forEach(btn => {
                    btn.disabled = true;
                    btn.style.cursor = 'not-allowed';
                    btn.style.opacity = '0.5';
                });
            }, 400);
        }
        // --- Handle HUD Shutdown ---
        if (this.time >= 50 && this.hudShutdownStage < 3) {
            this.hudShutdownStage = 1; // Hide paths
            setTimeout(() => { this.hudShutdownStage = 2; }, 500); // Hide left data
            setTimeout(() => { this.hudShutdownStage = 3; }, 1000); // Hide right data
        }

        if (this.time >= END_TIME) {
            this.isGameOver = true;
            if (this.backgroundMusic) this.backgroundMusic.pause();
            this.cockpit.classList.add('is-ending');
            this.uiPanel.style.display = 'none';

            setTimeout(() => {
                this.gameOverScreen.style.display = 'flex';
            }, 3000);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.hudShutdownStage < 1) {
            this.drawAugmentedPaths();
        }
        if (this.hudShutdownStage < 3) {
            this.drawBogusData();
        }

        this.ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            star.x += Math.cos(star.angle) * star.speed;
            star.y += Math.sin(star.angle) * star.speed;
            star.speed += 0.001; // Slow acceleration

            if (star.x < 0 || star.x > this.canvas.width || star.y < 0 || star.y > this.canvas.height) {
                star.x = this.canvas.width / 2;
                star.y = this.canvas.height / 2;
                star.angle = Math.random() * Math.PI * 2;
                star.speed = Math.random() * 2 + 0.5; // Reset speed
            }

            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawAugmentedPaths() {
        if (!this.simulationStarted || !this.redGiant || !this.yellowDwarf) return;

        const redGiantEl = this.redGiant.getElement();
        const yellowDwarfEl = this.yellowDwarf.getElement();

        const redGiantRect = redGiantEl.getBoundingClientRect();
        const yellowDwarfRect = yellowDwarfEl.getBoundingClientRect();

        const redGiantCenterX = redGiantRect.left + redGiantRect.width / 2;
        const redGiantCenterY = redGiantRect.top + redGiantRect.height / 2;
        const yellowDwarfCenterX = yellowDwarfRect.left + yellowDwarfRect.width / 2;
        const yellowDwarfCenterY = yellowDwarfRect.top + yellowDwarfRect.height / 2;

        this.ctx.save();
        this.ctx.lineWidth = 1;
        this.ctx.shadowBlur = 10;

        this.ctx.strokeStyle = this.hudFailureStage >= 1 ? '#ff3c3c' : '#00ff99';
        this.ctx.shadowColor = this.hudFailureStage >= 1 ? '#ff3c3c' : '#00ff99';

        const r1 = redGiantRect.width * 1.5;
        const r2 = yellowDwarfRect.width * 4;
        const dx = yellowDwarfCenterX - redGiantCenterX;
        const dy = yellowDwarfCenterY - redGiantCenterY;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d > Math.abs(r1 - r2)) {
            const a = Math.atan2(dy, dx);
            const k = (r1 - r2) / d;
            const b = Math.acos(k);

            const t1_a_start = a - b;
            const t1_a_end = a + b;
            const t2_a_start = a + Math.PI + b;
            const t2_a_end = a + Math.PI - b;

            this.ctx.beginPath();
            this.ctx.arc(redGiantCenterX, redGiantCenterY, r1, t1_a_start, t1_a_end);
            this.ctx.arc(yellowDwarfCenterX, yellowDwarfCenterY, r2, t2_a_end, t2_a_start);
            this.ctx.closePath();
            this.ctx.stroke();

            this.ctx.save();
            this.ctx.globalAlpha = 0.5;
            const innerR1 = r1 * 0.75;
            const innerR2 = r2 * 0.75;
            const innerK = (innerR1 - innerR2) / d;
            if (Math.abs(innerK) <= 1) {
                const innerB = Math.acos(innerK);
                this.ctx.beginPath();
                this.ctx.arc(redGiantCenterX, redGiantCenterY, innerR1, a - innerB, a + innerB);
                this.ctx.arc(yellowDwarfCenterX, yellowDwarfCenterY, innerR2, a + Math.PI + innerB, a + Math.PI - innerB);
                this.ctx.closePath();
                this.ctx.stroke();
            }
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    drawBogusData() {
        if (!this.simulationStarted) return;

        this.ctx.save();
        this.ctx.font = "12px 'Share Tech Mono', monospace";

        const xPos = 50;
        const dataPointCount = 5;
        let yPos = (this.canvas.height / 2) - (dataPointCount * 10); // 10 is half the line height

        if (this.hudShutdownStage < 2) {
            this.ctx.fillStyle = this.hudFailureStage >= 2 ? 'rgba(255, 60, 60, 0.7)' : 'rgba(0, 255, 153, 0.7)';
            const leftDataPoints = [
                `FLUX: ${(Math.random() * 100).toFixed(4)} GW`,
                `VECTOR: ${(Math.random() * 0.01).toFixed(5)}c`,
                `FIELD_D: ${Math.floor(Math.random() * 9000 + 1000)}`,
                `SIG_STR: -${(Math.random() * 30 + 50).toFixed(2)} dBm`,
                `TEMP_C: ${(Math.random() * 500 + 4500).toFixed(1)} K`
            ];

            leftDataPoints.forEach(point => {
                this.ctx.fillText(point, xPos, yPos);
                yPos += 20;
            });
        }

        const rightXPos = this.canvas.width - 200; // Position from the right edge
        let rightYPos = (this.canvas.height / 2) - (dataPointCount * 10); // Reset Y for the right column
        if (this.hudShutdownStage < 3) {
            this.ctx.fillStyle = this.hudFailureStage >= 3 ? 'rgba(255, 60, 60, 0.7)' : 'rgba(0, 255, 153, 0.7)';
            const rightDataPoints = [
                `PRIMARY (RG):`,
                ` MASS: ${(Math.random() * 2 + 7).toFixed(3)} M☉`,
                ` LUM: ${(Math.random() * 100 + 2500).toFixed(2)} L☉`,
                `SECONDARY (YD):`,
                ` MASS: ${(Math.random() * 0.2 + 0.9).toFixed(3)} M☉`,
                ` FLARE_P: ${(Math.random() * 0.01).toFixed(4)}%`
            ];

            rightDataPoints.forEach(point => {
                this.ctx.fillText(point, rightXPos, rightYPos);
                rightYPos += 20;
            });
        }

        this.ctx.restore();
    }
}