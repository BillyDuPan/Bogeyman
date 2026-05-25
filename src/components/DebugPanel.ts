
import { showResolutionOverlay } from './ResultsOverlay';
import type { DataEngine } from '../engine/DataEngine';
import type { EvaluationEngine } from '../engine/EvaluationEngine';
import type { ScoreHUD } from './ScoreHUD';
import type { GameCanvas } from './GameCanvas';

interface DebugPanelContext {
    dataEngine: DataEngine;
    evaluationEngine: EvaluationEngine;
    hud: ScoreHUD;
    canvas: GameCanvas;
    showLockerRoom: () => void;
}

let context: DebugPanelContext | null = null;

export function setupDebugPanel(ctx: DebugPanelContext) {
    context = ctx;

    // Register global keybind: D = toggle debug panel
    window.addEventListener('keydown', (e) => {
        if (e.key === 'd' || e.key === 'D') {
            toggleDebugPanel();
        }
    });
}

export function toggleDebugPanel() {
    let panel = document.getElementById('dev-debug-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        return;
    }

    if (!context) return;
    const { dataEngine, evaluationEngine, hud, canvas, showLockerRoom } = context;

    // Mount panel on first toggle
    panel = document.createElement('div');
    panel.id = 'dev-debug-panel';
    panel.className = 'debug-overlay';
    panel.innerHTML = `
        <div class="debug-title">DEBUG BOARD</div>
        <button id="db-win" class="debug-btn">Instant Settle (Sink)</button>
        <button id="db-cash" class="debug-btn">Add +$500 Cash</button>
        <button id="db-mulligan" class="debug-btn">Add +1 Mulligan</button>
        <button id="db-immune" class="debug-btn">Toggle Wind Resist</button>
    `;

    document.body.appendChild(panel);

    // ── Instant Sink cheat ──
    document.getElementById('db-win')?.addEventListener('click', () => {
        const state = dataEngine.getState();
        if (state.gameMode === 'play') {
            const mapGrid = dataEngine.getActiveMapGrid();
            let cupFound = false;
            for (let r = 0; r < 12; r++) {
                for (let c = 0; c < 16; c++) {
                    if (mapGrid[r][c] === 5) {
                        state.ball.pos = { x: c * 32 + 16, y: r * 32 + 16 };
                        state.ball.currentTileId = 5;
                        state.ball.isMoving = false;
                        cupFound = true;
                        break;
                    }
                }
                if (cupFound) break;
            }
            if (!state.currentFrame) {
                state.currentFrame = evaluationEngine.initializeStrokeFrame(state);
            }
            state.currentFrame.accumulatedBaseYards = 250;
            state.currentFrame.accumulatedMultiplier = 4.0;
            const res = evaluationEngine.settleStroke(state);
            showResolutionOverlay(true, res.logText);
            hud.update(state);
        }
    });

    // ── Add cash cheat ──
    document.getElementById('db-cash')?.addEventListener('click', () => {
        const state = dataEngine.getState();
        dataEngine.earnCash(500);
        hud.update(state);
        canvas.spawnTextPop(256, 192, '+$500 Cash Cheat!', 'var(--color-gold)');
        if (state.gameMode === 'locker') showLockerRoom();
    });

    // ── Add mulligan cheat ──
    document.getElementById('db-mulligan')?.addEventListener('click', () => {
        const state = dataEngine.getState();
        state.mulligansLeft++;
        hud.update(state);
        canvas.spawnTextPop(256, 192, '+1 Mulligan Cheat!', 'var(--color-mult)');
    });

    // ── Wind immunity toggle cheat ──
    document.getElementById('db-immune')?.addEventListener('click', () => {
        const state = dataEngine.getState();
        state.activeSleeve.windImmunity = !state.activeSleeve.windImmunity;
        hud.update(state);
        canvas.spawnTextPop(256, 192, `Wind Immunity: ${state.activeSleeve.windImmunity ? 'ON' : 'OFF'}`, 'var(--color-base)');
    });
}
