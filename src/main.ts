import './style.css';
import { audio } from './engine/AudioSynthesizer';
import { PhysicsEngine } from './engine/PhysicsEngine';
import { EvaluationEngine } from './engine/EvaluationEngine';
import { DataEngine } from './engine/DataEngine';
import { ScoreHUD } from './components/ScoreHUD';
import { GameCanvas } from './components/GameCanvas';
import { setupHowToPlay, showHowToPlayScreen } from './components/HowToPlay';
import { initBackgroundSpiral, resizeCabinetLayout } from './components/CabinetCosmetics';
import { setupLockerRoom, showLockerRoom } from './components/LockerRoomOverlay';
import { createTournamentSelect } from './components/TournamentSelectOverlay';
import { setupResultsOverlay, showResolutionOverlay } from './components/ResultsOverlay';
import { setupDebugPanel } from './components/DebugPanel';

// ─────────────────────────────────────────────────────────────
// Engine & Component Instantiation
// ─────────────────────────────────────────────────────────────
const dataEngine = new DataEngine();
const physicsEngine = new PhysicsEngine();
const evaluationEngine = new EvaluationEngine();
const hud = new ScoreHUD();
const canvas = new GameCanvas();

// Shared game state reference
const state = dataEngine.getState();

// DOM element lookups
const canvasContainer  = document.getElementById('game-canvas-container')!;
const hudContainer     = document.getElementById('game-hud-container')!;
const overlayContainer = document.getElementById('game-overlay-container')!;
const appContent       = document.getElementById('app-content')!;

// ─────────────────────────────────────────────────────────────
// 1. Bootstrap — Wire Components & Start
// ─────────────────────────────────────────────────────────────
function init() {
    // ── Register sub-component contexts ──
    setupHowToPlay({
        onComplete: () => {
            overlayContainer.style.display = 'none';
            overlayContainer.classList.remove('overlay-fullvp');
            appContent.style.opacity = '1.0';
            dataEngine.initializeTournament(0);
            dataEngine.setGameMode('play');
            hud.update(state);
        },
        resizeCabinetLayout,
        overlayContainer,
        appContent
    });

    const tournamentSelect = createTournamentSelect('game-tourselect-container');
    tournamentSelect.setContext({
        onPlay: () => {
            overlayContainer.style.display = 'none';
            appContent.style.opacity = '1.0';
            dataEngine.initializeTournament(state.currentTournamentIndex);
            dataEngine.setGameMode('play');
            hud.update(state);
            tournamentSelect.hide();
        },
        onBack: () => {
            tournamentSelect.hide();
            showLockerRoom();
        }
    });

    setupLockerRoom({ 
        dataEngine, 
        hud, 
        overlayContainer, 
        appContent, 
        showTitleScreen,
        showTournamentSelect: () => {
            overlayContainer.style.display = 'none';
            appContent.style.opacity = '0';
            tournamentSelect.show();
            tournamentSelect.update(state);
        }
    });

    setupResultsOverlay({
        dataEngine,
        hud,
        canvas,
        overlayContainer,
        appContent,
        showLockerRoom,
        showTitleScreen
    });

    setupDebugPanel({
        dataEngine,
        evaluationEngine,
        hud,
        canvas,
        showLockerRoom
    });

    // ── Physics Engine Callbacks → Canvas VFX ──
    physicsEngine.setCallbacks({
        onWallBounce: () => {
            canvas.triggerShake(6, 2);
            canvas.spawnSparks(state.ball.pos.x, state.ball.pos.y, '#00d2d3', 6);
        },
        onBumperHit: () => {
            canvas.triggerShake(12, 5);
            canvas.spawnSparks(state.ball.pos.x, state.ball.pos.y, '#e84118', 12);
            canvas.spawnTextPop(state.ball.pos.x, state.ball.pos.y, 'Bumper! +150 yds +0.5x', '#e84118');
        },
        onGateCrossed: () => {
            canvas.triggerShake(8, 2);
            canvas.spawnSparks(state.ball.pos.x, state.ball.pos.y, '#9c88ff', 12);
            canvas.spawnTextPop(state.ball.pos.x, state.ball.pos.y, 'Gate! x2.0 Mult', '#9c88ff');
        },
        onWaterSkim: () => {
            canvas.triggerShake(6, 1.5);
            canvas.spawnSparks(state.ball.pos.x, state.ball.pos.y, '#00a8ff', 8);
            canvas.spawnTextPop(state.ball.pos.x, state.ball.pos.y, 'Water Skim! +1.5x', '#00a8ff');
        },
        onWaterSink: () => {
            canvas.triggerShake(15, 3);
            canvas.spawnSparks(state.ball.pos.x, state.ball.pos.y, '#4a69bd', 16);
            canvas.spawnTextPop(state.ball.pos.x, state.ball.pos.y, 'Sunk in Water!', '#eb3b5a');
        }
    });

    // ── Mount GameCanvas — drag-to-shoot & build-mode tile placement ──
    canvas.mount(
        canvasContainer,
        // Shoot handler
        (velocity) => {
            if (state.gameMode !== 'play' || state.ball.isMoving || state.buildModeTileId !== null) return;

            dataEngine.saveMulliganSnapshot();

            const strokeFrame = evaluationEngine.initializeStrokeFrame(state);
            state.currentFrame = strokeFrame;

            let powerMultiplier = 1.0;
            const currentClub = state.activeBag.find(c => c.id === state.selectedClubId);
            if (currentClub) powerMultiplier = currentClub.powerScalar;

            physicsEngine.launchBall(state.ball, {
                x: velocity.x * powerMultiplier,
                y: velocity.y * powerMultiplier
            });

            audio.playShoot(Math.sqrt(velocity.x ** 2 + velocity.y ** 2) / 18);
            hud.update(state);
        },
        // Build-mode tile placement handler
        (r, c) => {
            if (state.gameMode !== 'play' || state.ball.isMoving || state.buildModeTileId === null) return;

            const existingIdx = state.placedBlocks.findIndex(b => b.r === r && b.c === c);
            if (existingIdx >= 0) {
                if (dataEngine.removeBlock(r, c)) {
                    audio.playTick();
                    canvas.spawnTextPop(c * 32 + 16, r * 32 + 16, 'Collected!', '#ffd32a');
                    canvas.spawnSparks(c * 32 + 16, r * 32 + 16, '#ffd32a', 6);
                }
            } else {
                const targetTileId = state.buildModeTileId;
                if (dataEngine.placeBlock(r, c, targetTileId)) {
                    audio.playGate();
                    canvas.spawnTextPop(c * 32 + 16, r * 32 + 16, 'Placed!', '#2ecc71');
                    canvas.spawnSparks(c * 32 + 16, r * 32 + 16, '#2ecc71', 8);
                    if ((state.blockInventory[targetTileId] || 0) === 0) {
                        state.buildModeTileId = null;
                    }
                } else {
                    audio.playBounce();
                    canvas.spawnTextPop(c * 32 + 16, r * 32 + 16, 'Blocked!', '#e74c3c');
                }
            }
            hud.update(state);
        }
    );

    // ── Mount Side HUD Panel ──
    hud.initialize(hudContainer, {
        onClubSelect: (clubId) => { dataEngine.selectClub(clubId); hud.update(state); },
        onSleeveSelect: (sleeveId) => { dataEngine.equipSleeve(sleeveId); audio.playTick(); hud.update(state); },
        onMulligan: () => {
            if (dataEngine.applyMulligan()) {
                canvas.spawnTextPop(state.ball.pos.x, state.ball.pos.y, 'Mulligan Rollback!', '#ff9ff3');
                hud.update(state);
            }
        },
        onDrop: () => {
            if (dataEngine.takeTelemetryDrop()) {
                canvas.spawnTextPop(state.ball.pos.x, state.ball.pos.y, 'Drop Taken! -500 pts', '#ff7675');
                hud.update(state);
            }
        },
        onBlockSelect: (tileId) => { 
            state.buildModeTileId = tileId; 
            if (tileId === 12) showBillyTip();
            hud.update(state); 
        },
        onReclaimAll: () => {
            dataEngine.reclaimAllPlacedBlocks();
            state.buildModeTileId = null;
            audio.playMulligan();
            canvas.spawnTextPop(state.ball.pos.x, state.ball.pos.y, 'Blocks Reclaimed!', '#ff7675');
            hud.update(state);
        }
    });

    // ── Input Handling (Block Rotation) ──
    window.addEventListener('keydown', (e) => {
        if ((e.key === 'r' || e.key === 'R') && state.gameMode === 'play' && state.buildModeTileId !== null) {
            if (state.buildModeTileId >= 12 && state.buildModeTileId <= 15) {
                state.buildModeTileId = state.buildModeTileId === 15 ? 12 : state.buildModeTileId + 1;
                audio.playTick();
                hud.update(state);
            }
        }
    });

    let hasSeenDiagonalTip = false;
    function showBillyTip() {
        if (hasSeenDiagonalTip) return;
        hasSeenDiagonalTip = true;
        const tip = document.createElement('div');
        tip.innerHTML = `<img id="billy-tip-img" src="/billy/1.png" style="width: 48px; height: 48px; margin-right: 12px; image-rendering: pixelated;"><div style="font-family: var(--font-ui); font-size: 14px; text-shadow: 1px 1px 0 #000; line-height: 1.4;"><b>Billy says:</b><br>Press <span style="color: var(--color-gold); font-family: var(--font-arcade);">R</span> to rotate diagonal blocks before placing them!</div>`;
        tip.style.position = 'fixed';
        tip.style.bottom = '20px';
        tip.style.left = '50%';
        tip.style.transform = 'translateX(-50%)';
        tip.style.backgroundColor = 'rgba(21, 19, 26, 0.95)';
        tip.style.border = '2px solid var(--border-neon)';
        tip.style.padding = '12px 20px';
        tip.style.borderRadius = '8px';
        tip.style.display = 'flex';
        tip.style.alignItems = 'center';
        tip.style.color = '#fff';
        tip.style.zIndex = '9999';
        tip.style.boxShadow = '0 0 20px rgba(0, 210, 211, 0.4)';
        document.body.appendChild(tip);

        // Animate Billy talking for a few seconds
        const imgEl = document.getElementById('billy-tip-img') as HTMLImageElement;
        let animTicks = 0;
        function animateTipMascot() {
            if (animTicks > 20 || !document.getElementById('billy-tip-img')) {
                if (imgEl) imgEl.src = "/billy/1.png";
                return;
            }
            animTicks++;
            const randFrame = Math.floor(Math.random() * 4) + 1;
            imgEl.src = `/billy/${randFrame}.png`;
            setTimeout(animateTipMascot, 60 + Math.random() * 120);
        }
        if (imgEl) animateTipMascot();

        setTimeout(() => {
            tip.style.transition = 'opacity 1s ease';
            tip.style.opacity = '0';
            setTimeout(() => tip.remove(), 1000);
        }, 6000);
    }

    // ── Settings Gear Modal ──
    const settingsBtn       = document.getElementById('btn-settings-toggle');
    const settingsModal     = document.getElementById('settings-modal');
    const settingsCloseBtn  = document.getElementById('btn-settings-close');

    settingsBtn?.addEventListener('click', () => {
        if (!settingsModal) return;
        const isHidden = settingsModal.style.display === 'none';
        settingsModal.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
            (document.getElementById('modal-sfx-vol') as HTMLInputElement  )?.setAttribute('value', state.sfxVolume.toString());
            (document.getElementById('modal-music-vol') as HTMLInputElement )?.setAttribute('value', state.musicVolume.toString());
            (document.getElementById('modal-bgm-track') as HTMLSelectElement)?.setAttribute('value', state.selectedTrack);
        }
    });
    settingsCloseBtn?.addEventListener('click', () => { if (settingsModal) settingsModal.style.display = 'none'; });
    settingsModal?.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.style.display = 'none'; });

    // ── Legend Modal ──
    const legendBtn      = document.getElementById('btn-legend-toggle');
    const legendModal    = document.getElementById('legend-modal');
    const legendCloseBtn = document.getElementById('btn-legend-close');
    legendBtn?.addEventListener('click',      () => { if (legendModal) legendModal.style.display = 'flex'; });
    legendCloseBtn?.addEventListener('click', () => { if (legendModal) legendModal.style.display = 'none'; });
    legendModal?.addEventListener('click', (e) => { if (e.target === legendModal) legendModal.style.display = 'none'; });

    // ── Fullscreen Toggle ──
    document.getElementById('btn-fullscreen-toggle')?.addEventListener('click', () => {
        audio.playGate();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    });

    // ── Settings Audio Controls ──
    (document.getElementById('modal-sfx-vol') as HTMLInputElement)?.addEventListener('input', (e) => {
        const vol = parseFloat((e.target as HTMLInputElement).value);
        state.sfxVolume = vol;
        audio.setSFXVolume(vol);
        hud.update(state);
    });
    (document.getElementById('modal-music-vol') as HTMLInputElement)?.addEventListener('input', (e) => {
        const vol = parseFloat((e.target as HTMLInputElement).value);
        state.musicVolume = vol;
        audio.setMusicVolume(vol);
        hud.update(state);
    });
    (document.getElementById('modal-bgm-track') as HTMLSelectElement)?.addEventListener('change', (e) => {
        const trackVal = (e.target as HTMLSelectElement).value;
        state.selectedTrack = trackVal;
        audio.setBGMTrack(trackVal === 'custom' ? '/bgm/endless_fairway_run.mp3' : '/bgm/soundtrack.mp3');
        hud.update(state);
    });

    // ── Background & Layout ──
    initBackgroundSpiral();

    // ── Start Title Screen ──
    showTitleScreen();

    // ── Kick off Animation Loop ──
    requestAnimationFrame(ticker);
}

// ─────────────────────────────────────────────────────────────
// 2. Title Screen
// ─────────────────────────────────────────────────────────────
function showTitleScreen() {
    dataEngine.setGameMode('title');
    appContent.style.opacity = '0';
    overlayContainer.classList.add('overlay-fullvp');
    overlayContainer.style.display = 'flex';

    overlayContainer.innerHTML = `
        <div class="screen-overlay title-overlay">
            <img src="/Bogeyman%20The%20Golfing%20Roguelike.png" class="title-logo" alt="Bogeyman: The Golfing Roguelike">
            <button id="btn-press-start" class="screen-btn" style="font-size: 1em; padding: 0.8em 2.5em; animation: subtlePulse 2s ease-in-out infinite;">
                START GAME
            </button>
        </div>
    `;

    document.getElementById('btn-press-start')?.addEventListener('click', () => {
        audio.playGate();
        audio.startBGM();
        showHowToPlayScreen();
    });
}

// ─────────────────────────────────────────────────────────────
// 3. Game Ticker Loop
// ─────────────────────────────────────────────────────────────
function ticker() {
    if (state.gameMode === 'play') {
        if (state.ball.isMoving) {
            physicsEngine.updateFrame(
                state.ball,
                state.currentFrame!,
                dataEngine.getActiveMapGrid(),
                state.activeSleeve.elasticity,
                state.wind,
                state.activeSleeve.windImmunity
            );

            hud.update(state);

            // Physics settled — evaluate stroke
            if (!state.ball.isMoving) {
                const settleResult = evaluationEngine.settleStroke(state);

                canvas.spawnTextPop(
                    state.ball.pos.x,
                    state.ball.pos.y,
                    settleResult.wasSunk ? 'SUNK!' : `+${settleResult.points} yds`,
                    settleResult.wasSunk ? 'var(--color-gold)' : 'var(--color-base)'
                );

                hud.update(state);

                if (settleResult.wasSunk) {
                    canvas.spawnSparks(state.ball.pos.x, state.ball.pos.y, 'var(--color-gold)', 24);
                    canvas.triggerShake(45, 8);
                    setTimeout(() => showResolutionOverlay(true, settleResult.logText), 500);
                } else if (settleResult.wasDnf) {
                    canvas.spawnSparks(state.ball.pos.x, state.ball.pos.y, 'var(--color-danger)', 24);
                    canvas.triggerShake(35, 6);
                    setTimeout(() => showResolutionOverlay(false, settleResult.logText), 500);
                }
            }
        }

        canvas.render(state);
    }

    requestAnimationFrame(ticker);
}

// ─────────────────────────────────────────────────────────────
// Entry Point
// ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    init();
});
