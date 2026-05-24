import './style.css';
import { audio } from './engine/AudioSynthesizer';
import { PhysicsEngine } from './engine/PhysicsEngine';
import { EvaluationEngine } from './engine/EvaluationEngine';
import { DataEngine, DRAFTABLE_SLEEVES } from './engine/DataEngine';
import { ScoreHUD } from './components/ScoreHUD';
import { GameCanvas } from './components/GameCanvas';
import { TOURNAMENT_DATA } from './config/terrain';

// Instantiate engines and components
const dataEngine = new DataEngine();
const physicsEngine = new PhysicsEngine();
const evaluationEngine = new EvaluationEngine();

const hud = new ScoreHUD();
const canvas = new GameCanvas();

// Retrieve game state references
const state = dataEngine.getState();

// Setup DOM element lookups
const canvasContainer = document.getElementById('game-canvas-container')!;
const hudContainer = document.getElementById('game-hud-container')!;
const overlayContainer = document.getElementById('game-overlay-container')!;
const appContent = document.getElementById('app-content')!;

// ----------------------------------------------------
// 1. Initializers & Bootstrapper
// ----------------------------------------------------
function init() {
    // Connect physics engine event callbacks to canvas sparks/shake triggers
    physicsEngine.setCallbacks({
        onWallBounce: () => {
            canvas.triggerShake(6, 2);
            canvas.spawnSparks(state.ball.pos.x, state.ball.pos.y, '#00d2d3', 6);
        },
        onBumperHit: () => {
            canvas.triggerShake(12, 5);
            // Spawn neon sparks at ball contact coordinate
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

    // Mount GameCanvas & drag handlers
    canvas.mount(canvasContainer, (velocity) => {
        if (state.gameMode !== 'play' || state.ball.isMoving) return;

        // Record Mulligan history snapshot prior to firing ball
        dataEngine.saveMulliganSnapshot();

        // Build stroke tracker frame details
        const strokeFrame = evaluationEngine.initializeStrokeFrame(state);
        state.currentFrame = strokeFrame;

        // Apply Club address hooks (like Illegal 1-Iron power multipliers)
        let powerMultiplier = 1.0;
        const currentClub = state.activeBag.find(c => c.id === state.selectedClubId);
        if (currentClub) {
            powerMultiplier = currentClub.powerScalar;
        }

        // Apply launch velocity physics
        const launchVelocity = {
            x: velocity.x * powerMultiplier,
            y: velocity.y * powerMultiplier
        };

        physicsEngine.launchBall(state.ball, launchVelocity);

        // Sound Synthesis
        audio.playShoot(Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) / 18);
        
        hud.update(state);
    });

    // Mount Side HUD controller panel
    hud.initialize(hudContainer, {
        onClubSelect: (clubId) => {
            dataEngine.selectClub(clubId);
            hud.update(state);
        },
        onSleeveSelect: (sleeveId) => {
            dataEngine.equipSleeve(sleeveId);
            audio.playTick();
            hud.update(state);
        },
        onMulligan: () => {
            const success = dataEngine.applyMulligan();
            if (success) {
                canvas.spawnTextPop(state.ball.pos.x, state.ball.pos.y, 'Mulligan Rollback!', '#ff9ff3');
                hud.update(state);
            }
        },
        onDrop: () => {
            const success = dataEngine.takeTelemetryDrop();
            if (success) {
                canvas.spawnTextPop(state.ball.pos.x, state.ball.pos.y, 'Drop Taken! -500 pts', '#ff7675');
                hud.update(state);
            }
        }
    });




    // Keybindings: Press D for Developer Console panel
    window.addEventListener('keydown', (e) => {
        if (e.key === 'd' || e.key === 'D') {
            toggleDebugPanel();
        }
    });

    // Start background spiral animation
    initBackgroundSpiral();

    // Setup Fixed Settings Gear Modal Bindings
    const settingsBtn = document.getElementById('btn-settings-toggle');
    const settingsModal = document.getElementById('settings-modal');
    const settingsCloseBtn = document.getElementById('btn-settings-close');
    
    settingsBtn?.addEventListener('click', () => {
        if (settingsModal) {
            const isHidden = settingsModal.style.display === 'none';
            settingsModal.style.display = isHidden ? 'flex' : 'none';
            if (isHidden) {
                // Sync input positions in modal with current values
                const modalSfx = document.getElementById('modal-sfx-vol') as HTMLInputElement;
                const modalMusic = document.getElementById('modal-music-vol') as HTMLInputElement;
                const modalTrack = document.getElementById('modal-bgm-track') as HTMLSelectElement;
                
                if (modalSfx) modalSfx.value = state.sfxVolume.toString();
                if (modalMusic) modalMusic.value = state.musicVolume.toString();
                if (modalTrack) modalTrack.value = state.selectedTrack;
            }
        }
    });

    settingsCloseBtn?.addEventListener('click', () => {
        if (settingsModal) settingsModal.style.display = 'none';
    });

    // Close settings modal when clicking outside modal-content
    settingsModal?.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // Setup Legend ? Button
    const legendBtn = document.getElementById('btn-legend-toggle');
    const legendModal = document.getElementById('legend-modal');
    const legendCloseBtn = document.getElementById('btn-legend-close');

    legendBtn?.addEventListener('click', () => {
        if (legendModal) legendModal.style.display = 'flex';
    });
    legendCloseBtn?.addEventListener('click', () => {
        if (legendModal) legendModal.style.display = 'none';
    });
    legendModal?.addEventListener('click', (e) => {
        if (e.target === legendModal) legendModal.style.display = 'none';
    });

    // Browser Fullscreen API Toggle button
    const fullscreenToggle = document.getElementById('btn-fullscreen-toggle');
    fullscreenToggle?.addEventListener('click', () => {
        audio.playGate();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error enabling fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    const modalSfx = document.getElementById('modal-sfx-vol') as HTMLInputElement;
    modalSfx?.addEventListener('input', (e) => {
        const vol = parseFloat((e.target as HTMLInputElement).value);
        state.sfxVolume = vol;
        audio.setSFXVolume(vol);
        hud.update(state); // Sync HUD sfx slider position
    });

    const modalMusic = document.getElementById('modal-music-vol') as HTMLInputElement;
    modalMusic?.addEventListener('input', (e) => {
        const vol = parseFloat((e.target as HTMLInputElement).value);
        state.musicVolume = vol;
        audio.setMusicVolume(vol);
        hud.update(state); // Sync HUD music slider position
    });

    const modalTrack = document.getElementById('modal-bgm-track') as HTMLSelectElement;
    modalTrack?.addEventListener('change', (e) => {
        const trackVal = (e.target as HTMLSelectElement).value;
        state.selectedTrack = trackVal;
        const src = trackVal === 'custom' ? '/bgm/endless_fairway_run.mp3' : '/bgm/soundtrack.mp3';
        audio.setBGMTrack(src);
        hud.update(state); // Sync HUD BGM selection dropdown position
    });

    // Start title screen setup
    showTitleScreen();
    
    // Start Animation Frames Ticker Loop
    requestAnimationFrame(ticker);
}

// ----------------------------------------------------
// 2. Game View Transitions
// ----------------------------------------------------
function showTitleScreen() {
    dataEngine.setGameMode('title');
    appContent.style.opacity = '0';
    overlayContainer.classList.add('overlay-fullvp');
    overlayContainer.style.display = 'flex';

    overlayContainer.innerHTML = `
        <div class="screen-overlay title-overlay">
            <img src="/Bogeyman%20The%20Golfing%20Roguelike.png" class="title-logo" alt="Bogeyman: The Golfing Roguelike">
            <button id="btn-press-start" class="screen-btn" style="font-size: 1em; padding: 0.8em 2.5em; animation: dopaminePop 1.5s ease-in-out infinite;">
                START GAME
            </button>
        </div>
    `;

    document.getElementById('btn-press-start')?.addEventListener('click', () => {
        audio.playGate();
        audio.startBGM(); // Start music on click (user interaction unlocks Audio Context)
        showHowToPlayScreen();
    });
}

interface TutorialSlide {
    title: string;
    text: string;
    icon: string;
    showScaleSettings?: boolean;
    mockupHtml?: string;
}

const TUTORIAL_SLIDES: TutorialSlide[] = [
    {
        title: "1. AIM & STRIKE",
        text: "Click and drag anywhere on the field to aim.<br><br>Pull back in the opposite direction and release to strike.<br><br>Sink the ball in the cup with the fewest strokes!",
        icon: "⛳",
        mockupHtml: `
            <div class="aim-demo-container">
                <div class="aim-demo-cup"></div>
                <div class="aim-demo-flag">⛳</div>
                <div class="aim-demo-launch-line"></div>
                <div class="aim-demo-drag-line"></div>
                <div class="aim-demo-ball"></div>
                <div class="aim-demo-cursor">👆</div>
            </div>
        `
    },
    {
        title: "2. MULTIPLIERS",
        text: "Total score = Yards &times; Multiplier.<br><br>Bounce off solid walls to add <strong>+0.5x</strong> multiplier.<br><br>Pass through glowing arches to <strong>double (x2.0)</strong> your multiplier!",
        icon: "✨",
        mockupHtml: `
            <div style="display: flex; gap: 8px; justify-content: center; margin: 1.2em 0; pointer-events: none; width: 100%;">
                <div class="hud-block" style="width: 110px; padding: 0.8em; text-align: center; border-color: var(--color-mult); background: #15131a;">
                    <div class="hud-title" style="font-size: 0.7em; margin-bottom: 4px;">Multiplier</div>
                    <div class="hud-value-large mult" style="font-size: 0.85em; margin: 0; color: var(--color-mult); font-family: var(--font-arcade); animation: dopaminePop 1.5s infinite;">2.50x</div>
                </div>
                <div class="hud-block" style="width: 110px; padding: 0.8em; text-align: center; border-color: var(--color-base); background: #15131a;">
                    <div class="hud-title" style="font-size: 0.7em; margin-bottom: 4px;">Current Shot</div>
                    <div class="hud-value-large base" style="font-size: 0.85em; margin: 0; color: var(--color-base); font-family: var(--font-arcade);">+450 pts</div>
                </div>
            </div>
        `
    },
    {
        title: "3. CLUBS & LIE PHYSICS",
        text: "Terrain affects your shot starting multiplier.<br><br>Sand reduces lie to <strong>0.3x</strong>, Rough to <strong>0.5x</strong>.<br><br>Choose Wedges for sand traps, and Putters on the Green!",
        icon: "🏌️",
        mockupHtml: `
            <div style="width: 220px; margin: 1.2em auto; pointer-events: none;">
                <div class="club-card selected" style="padding: 0.6em 0.8em; border-color: var(--color-base); background: rgba(243, 156, 18, 0.12); display: flex; justify-content: space-between; align-items: center; border-radius: 4px;">
                    <div class="club-card-left" style="text-align: left; display: flex; flex-direction: column; line-height: 1.2;">
                        <span class="club-card-name" style="font-size: 0.8em; font-weight: bold; color: #ffffff;">Steel Wedge</span>
                        <span class="club-card-desc" style="font-size: 0.7em; color: rgba(255,255,255,0.6);">Bypasses Sand Penalty</span>
                    </div>
                    <span class="club-card-power" style="font-size: 0.55em; font-family: var(--font-arcade); color: var(--color-gold);">0.8x Power</span>
                </div>
            </div>
        `
    },
    {
        title: "4. THE MULLIGAN",
        text: "Made a terrible shot? Don't panic!<br><br>Click the Mulligan button on the HUD to rewind time, restore your ball position, and retry the shot.",
        icon: "⏪",
        mockupHtml: `
            <div style="display: flex; justify-content: center; margin: 1.2em 0; pointer-events: none;">
                <button class="action-btn" style="width: 140px; padding: 0.6em; display: flex; flex-direction: column; align-items: center; background: #2d2a36; border: 2px solid var(--color-mult); border-bottom-width: 4px; border-radius: 4px; color: #ffffff; line-height: 1.2;">
                    <span style="font-size: 0.72em; font-weight: bold;">Mulligan</span>
                    <span class="count" style="font-size: 0.45em; font-family: var(--font-arcade); color: var(--color-mult); margin-top: 2px;">Charges: 2</span>
                </button>
            </div>
        `
    },
    {
        title: "5. AUDIO & FULLSCREEN",
        text: "Adjust the volume or toggle fullscreen at any time!<br><br>Click the <strong>Gear Icon (⚙)</strong> in the bottom-left corner to adjust SFX/music, swap soundtracks, or enter full browser view.",
        icon: "⚙️",
        mockupHtml: `
            <div class="hud-block" style="width: 220px; margin: 1.2em auto; padding: 0.8em; text-align: left; font-size: 0.75em; border-color: var(--border-steel); background: #15131a; pointer-events: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 0.9em;">SFX Volume:</span>
                    <input type="range" min="0" max="1" step="0.1" value="0.5" style="width: 70px; accent-color: var(--color-base); height: 6px; cursor: pointer;" />
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.9em;">Music Vol:</span>
                    <input type="range" min="0" max="1" step="0.1" value="0.5" style="width: 70px; accent-color: var(--color-mult); height: 6px; cursor: pointer;" />
                </div>
            </div>
        `
    },
    {
        title: "6. TOURNAMENT CUTS",
        text: "Advance through 8 pro tournaments.<br><br>Achieve the target cut score to earn cash rewards and unlock new gear in the Locker Room Shop!",
        icon: "🏆",
        mockupHtml: `
            <div class="hud-block" style="width: 220px; margin: 1.2em auto; padding: 0.8em; font-size: 0.75em; text-align: left; border-color: var(--color-success); background: rgba(39, 174, 96, 0.05); pointer-events: none;">
                <div class="hud-score-row" style="margin-bottom: 6px; display: flex; justify-content: space-between; font-size: 0.9em;">
                    <span>Recap: Payout</span>
                    <span style="color: var(--color-success); font-weight: bold;">+$250 Cash</span>
                </div>
                <div class="hud-score-row" style="display: flex; justify-content: space-between; font-size: 0.9em;">
                    <span>vs Cut Line</span>
                    <span style="color: var(--color-gold);">1,250 / 800 pts</span>
                </div>
            </div>
        `
    }
];

function showHowToPlayScreen(stepIndex: number = 0) {
    appContent.style.opacity = '0';
    overlayContainer.classList.add('overlay-fullvp');
    const slide = TUTORIAL_SLIDES[stepIndex];
    const isLast = stepIndex === TUTORIAL_SLIDES.length - 1;

    overlayContainer.innerHTML = `
        <div class="screen-overlay" style="justify-content: center; padding: 0.6em 1em; max-height: 100%; overflow-y: auto; background: rgba(9,7,18,0.68); display: flex; flex-direction: column; align-items: center; box-sizing: border-box;">
            <h2 style="font-size: 1.1em; margin-bottom: 0.1em; color: var(--color-base); font-family: var(--font-arcade); text-shadow: 2px 2px 0 #000;">HOW TO PLAY</h2>
            <div class="arcade-subtitle" style="font-size: 0.62em; margin-bottom: 0.5em;">Step ${stepIndex + 1} of ${TUTORIAL_SLIDES.length}</div>
            
            <div class="tutorial-container">
                <!-- Left Column: Instructions -->
                <div class="tutorial-left-panel">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <span class="tutorial-inline-icon">${slide.icon}</span>
                        <h3 style="margin: 0;">${slide.title}</h3>
                    </div>
                    <p>${slide.text}</p>
                </div>

                <!-- Right Column: Mockup/Graphic -->
                <div class="tutorial-right-panel">
                    ${slide.mockupHtml || ''}
                </div>
            </div>

            <!-- Progress dots indicators -->
            <div class="progress-dots">
                ${TUTORIAL_SLIDES.map((_, idx) => `
                    <div class="dot ${idx === stepIndex ? 'active' : ''}"></div>
                `).join('')}
            </div>

            <!-- Navigation buttons -->
            <div class="tutorial-nav">
                ${stepIndex > 0 ? `
                    <button id="btn-tut-back" class="screen-btn" style="background: #57606f; border-color: #2f3542; border-bottom-color: #1e2229; flex: 1;">
                        &lt; BACK
                    </button>
                ` : ''}
                
                <button id="btn-tut-next" class="screen-btn" style="flex: 2;">
                    ${isLast ? 'EMBARK ON PRO SEASON' : 'NEXT &gt;'}
                </button>
            </div>

            <button id="btn-tut-skip" class="skip-btn">
                Skip Tutorial
            </button>
        </div>
    `;

    // Bind navigation actions
    document.getElementById('btn-tut-back')?.addEventListener('click', () => {
        audio.playTick();
        showHowToPlayScreen(stepIndex - 1);
    });

    document.getElementById('btn-tut-next')?.addEventListener('click', () => {
        if (isLast) {
            audio.playGate();
            showLockerRoom();
        } else {
            audio.playTick();
            showHowToPlayScreen(stepIndex + 1);
        }
    });

    document.getElementById('btn-tut-skip')?.addEventListener('click', () => {
        audio.playGate();
        showLockerRoom();
    });

    // Force layout refresh immediately to guarantee display consistency
    resizeCabinetLayout();
}


// ─────────────────────────────────────────────────────────────
// LOCKER ROOM HUB — 3-tab hub (Loadout / Shop / Tour Map)
// ─────────────────────────────────────────────────────────────
function showLockerRoom(_activeTab: 'loadout' | 'shop' | 'tourmap' = 'loadout') {
    dataEngine.setGameMode('locker');
    overlayContainer.classList.remove('overlay-fullvp');
    overlayContainer.style.display = 'flex';
    appContent.style.opacity = '0.12';

    const nextTournamentIndex = state.currentTournamentIndex + 1;
    const isFirstTime = state.tournamentResults.length === 0;
    const hasPendingNext = nextTournamentIndex < TOURNAMENT_DATA.length;
    const isSeasonOver = !hasPendingNext;
    const hasShopDraft = state.shopDraft.length > 0;

    const nextTourney = hasPendingNext ? TOURNAMENT_DATA[nextTournamentIndex] : null;
    const isLastTournament = nextTournamentIndex === TOURNAMENT_DATA.length - 1;
    const teeOffLabel = isFirstTime
        ? `TEE OFF — ${TOURNAMENT_DATA[0].name.toUpperCase()}`
        : nextTourney
            ? isLastTournament
                ? `☠️ FACE THE BOGEYMAN`
                : `TEE OFF — ${nextTourney.name.toUpperCase()}`
            : '☠️ BOGEYMAN DEFEATED';

    const allClubs = [...state.activeBag].sort((a, b) => b.powerScalar - a.powerScalar);
    const allSleeves = DRAFTABLE_SLEEVES.filter(s => state.inventorySleeves.includes(s.id));
    const totalCashEarned = state.tournamentResults.reduce((sum, r) => sum + r.cashEarned, 0);

    // ── Build Tour List ──
    const tourListHTML = TOURNAMENT_DATA.map((t, idx) => {
        const result = state.tournamentResults.find(r => r.tournamentIndex === idx);
        const isCurrent = !isFirstTime && (nextTournamentIndex === idx || (isSeasonOver && idx === TOURNAMENT_DATA.length - 1));
        const isFirst = isFirstTime && idx === 0;

        let statusIcon = '○';
        let rowClass = 'lr-tour-row--upcoming';
        let scoreDisplay = `<span class="lr-tour-cut">Cut: ${t.cutTarget.toLocaleString()}</span>`;

        if (isFirst || (isCurrent && !result)) {
            statusIcon = '►';
            rowClass = 'lr-tour-row--current';
        } else if (result) {
            statusIcon = result.passed ? '✓' : '✗';
            rowClass = result.passed ? 'lr-tour-row--pass' : 'lr-tour-row--fail';
            scoreDisplay = `
                <span class="lr-tour-score ${result.passed ? 'lr-score--pass' : 'lr-score--fail'}">
                    ${result.score.toLocaleString()} pts
                </span>
                ${result.passed ? `<span class="lr-tour-cash">+$${result.cashEarned}</span>` : ''}
            `;
        }

        return `
            <div class="lr-tour-row ${rowClass}">
                <div class="lr-tour-status">${statusIcon}</div>
                <div class="lr-tour-info">
                    <div class="lr-tour-name">T${idx + 1}. ${t.name}</div>
                    <div class="lr-tour-meta">${scoreDisplay}</div>
                </div>
                ${result?.passed ? `<div class="lr-tour-reward">$${result.cashEarned}</div>` : ''}
            </div>
        `;
    }).join('');

    // ── Build Shop Panel ──
    const gambleResult = state.lastGambleResult;
    state.lastGambleResult = null; // clear after reading so it doesn't persist

    const canReroll = state.shopRerollsLeft > 0 || state.money >= 25;
    const rerollLabel = state.shopRerollsLeft > 0
        ? `🎲 REROLL <span class="lr-reroll-free">${state.shopRerollsLeft} FREE</span>`
        : `🎲 REROLL <span class="lr-reroll-cost">$25</span>`;

    const TYPE_META: Record<string, { icon: string; label: string; cls: string }> = {
        club:         { icon: '💀', label: 'RELIC CLUB',     cls: 'club'    },
        sleeve:       { icon: '🔮', label: 'SPIRIT BALL',    cls: 'sleeve'  },
        mulligan:     { icon: '👻', label: 'SPIRIT CHARGE',  cls: 'consume' },
        stroke_boost: { icon: '⚡', label: 'STROKE BOOST',   cls: 'consume' },
        cash_boost:   { icon: '💰', label: 'GOLD INFUSION',  cls: 'gold'    },
        gamble:       { icon: '🎲', label: 'THE WAGER',      cls: 'gamble'  },
    };

    const shopHTML = hasShopDraft ? `
        <div class="lr-shop">
            <div class="lr-shop-hdr">
                <div class="lr-shop-hdr-left">
                    <span class="lr-shop-hdr-title">👻 CURSED RELICS</span>
                    <span class="lr-shop-hdr-sub">Spend wisely — the Bogeyman is watching</span>
                </div>
                ${gambleResult !== null ? `
                    <div class="lr-gamble-result ${gambleResult.won ? 'lr-gamble-result--win' : 'lr-gamble-result--lose'}">
                        ${gambleResult.won ? `🎰 WON $${gambleResult.amount}!` : '💀 LOST THE WAGER'}
                    </div>
                ` : ''}
                <button class="lr-reroll-btn" id="btn-shop-reroll" ${!canReroll ? 'disabled' : ''}>
                    ${rerollLabel}
                </button>
            </div>
            <div class="lr-shop-grid">
                ${state.shopDraft.map((item, idx) => {
                    const isOwnedClub   = item.type === 'club'   && state.inventoryClubs.includes(item.id);
                    const isOwnedSleeve = item.type === 'sleeve' && state.inventorySleeves.includes(item.id);
                    const owned = isOwnedClub || isOwnedSleeve;
                    const canAfford = state.money >= item.price;
                    const buyable = !owned && canAfford;
                    const meta = TYPE_META[item.type] ?? { icon: '?', label: item.type, cls: '' };

                    let hint = '';
                    if (item.type === 'cash_boost')
                        hint = `Pay $${item.price} → Receive $${item.amount} <em>(+$${(item.amount ?? 0) - item.price} net)</em>`;
                    else if (item.type === 'gamble')
                        hint = `50%: WIN $${item.amount} &nbsp;|&nbsp; 50%: keep nothing`;
                    else if (item.type === 'mulligan' && (item.amount ?? 1) > 1)
                        hint = `Grants +${item.amount} charges`;
                    else if (item.type === 'stroke_boost' && (item.amount ?? 1) > 1)
                        hint = `Grants +${item.amount} strokes`;

                    const btnLabel = owned ? 'OWNED'
                        : !canAfford ? 'NEED GOLD'
                        : item.type === 'gamble' ? 'ROLL BONES'
                        : 'ACQUIRE';

                    return `
                        <div class="lr-shop-card lr-shop-card--${meta.cls} ${owned ? 'lr-shop-card--owned' : ''} ${!canAfford && !owned ? 'lr-shop-card--broke' : ''}">
                            <div class="lr-shop-card-top">
                                <span class="lr-shop-card-icon">${meta.icon}</span>
                                <span class="lr-shop-card-typelabel">${meta.label}</span>
                            </div>
                            <div class="lr-shop-card-name">${item.name}</div>
                            <div class="lr-shop-card-desc">${item.description}</div>
                            ${hint ? `<div class="lr-shop-card-hint">${hint}</div>` : ''}
                            <div class="lr-shop-card-footer">
                                <span class="lr-shop-card-price">${item.price === 0 ? 'FREE' : '$' + item.price}</span>
                                <button class="lr-shop-card-btn" data-draft-idx="${idx}" ${buyable ? '' : 'disabled'}>
                                    ${btnLabel}
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    ` : `
        <div class="lr-shop lr-shop--locked">
            <span class="lr-shop-locked-icon">🔒</span>
            <div class="lr-shop-locked-text">
                <div class="lr-shop-hdr-title">RELICS SEALED</div>
                <div class="lr-shop-hdr-sub">Survive the cut to break the seal</div>
            </div>
        </div>
    `;

    overlayContainer.innerHTML = `
        <div class="lr-hub">
            <!-- Header -->
            <div class="lr-header">
                <div class="lr-title">THE HAUNTED LOCKER</div>
                <div class="lr-cash-badge">
                    <span class="lr-cash-label">SOUL GOLD</span>
                    <span class="lr-cash-value" id="lr-cash-display">$${state.money}</span>
                </div>
            </div>

            <!-- Main 3-column body -->
            <div class="lr-body">
                <!-- Club Bag Panel -->
                <div class="lr-panel lr-panel--clubs">
                    <div class="lr-panel-header">
                        <span class="lr-panel-title-text">💀 CURSED BAG</span>
                        <span class="lr-panel-count">${allClubs.length}</span>
                    </div>
                    <div class="lr-panel-body">
                        <div class="lr-club-list">
                            ${allClubs.map(club => `
                                <div class="lr-club-item ${club.id === state.selectedClubId ? 'lr-club-item--active' : ''}"
                                     data-club-id="${club.id}">
                                    <div class="lr-club-meta">
                                        <span class="lr-club-name">${club.name}</span>
                                        <span class="lr-club-type">${club.clubType}</span>
                                    </div>
                                    <span class="lr-club-desc">${club.description}</span>
                                    <span class="lr-club-power">${club.powerScalar.toFixed(1)}x</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Ball Sleeves Panel -->
                <div class="lr-panel lr-panel--sleeves">
                    <div class="lr-panel-header">
                        <span class="lr-panel-title-text">🔮 SPIRIT BALLS</span>
                        <span class="lr-panel-count">${allSleeves.length}</span>
                    </div>
                    <div class="lr-panel-body">
                        ${allSleeves.length > 0 ? `
                            <div class="lr-sleeve-list">
                                ${allSleeves.map(sleeve => `
                                    <div class="lr-sleeve-card ${sleeve.id === state.activeSleeve.id ? 'lr-sleeve-card--active' : ''}"
                                         data-sleeve-id="${sleeve.id}">
                                        <div class="lr-sleeve-name">${sleeve.name}</div>
                                        <div class="lr-sleeve-stats">
                                            <span class="lr-sleeve-stat">Elasticity ${sleeve.elasticity.toFixed(2)}</span>
                                            ${sleeve.windImmunity ? '<span class="lr-sleeve-stat lr-sleeve-stat--special">Wind Immune</span>' : ''}
                                        </div>
                                        <div class="lr-sleeve-equip-badge">
                                            ${sleeve.id === state.activeSleeve.id ? '✓ EQUIPPED' : 'EQUIP'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `<div class="lr-panel-empty">No spirit balls found</div>`}
                    </div>
                </div>

                <!-- Season Tour Panel -->
                <div class="lr-panel lr-panel--tour">
                    <div class="lr-panel-header">
                        <span class="lr-panel-title-text">☠️ THE HAUNTING</span>
                        <span class="lr-panel-count">${state.tournamentResults.filter(r => r.passed).length} SURVIVED</span>
                    </div>
                    <div class="lr-tour-summary-row">
                        <span class="lr-tour-earned">Soul Gold: <strong>$${totalCashEarned}</strong></span>
                    </div>
                    <div class="lr-panel-body">
                        <div class="lr-tour-list">
                            ${tourListHTML}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Shop Panel -->
            ${shopHTML}

            <!-- Footer -->
            <div class="lr-footer">
                ${state.pendingExtraStrokes > 0 ? `
                    <div class="lr-pending-bonus">+${state.pendingExtraStrokes} bonus stroke(s) ready for next round</div>
                ` : ''}
                <button id="btn-tee-off" class="screen-btn lr-tee-btn ${isSeasonOver ? 'lr-tee-btn--disabled' : ''}">
                    ${teeOffLabel}
                </button>
            </div>
        </div>
    `;

    // ── Wire club selection ──
    overlayContainer.querySelectorAll('.lr-club-item').forEach(item => {
        item.addEventListener('click', () => {
            const clubId = item.getAttribute('data-club-id')!;
            dataEngine.selectClub(clubId);
            audio.playTick();
            showLockerRoom();
        });
    });

    // ── Wire sleeve equip ──
    overlayContainer.querySelectorAll('.lr-sleeve-card').forEach(card => {
        card.addEventListener('click', () => {
            const sleeveId = card.getAttribute('data-sleeve-id')!;
            dataEngine.equipSleeve(sleeveId);
            audio.playTick();
            showLockerRoom();
        });
    });

    // ── Wire shop buy buttons ──
    overlayContainer.querySelectorAll('.lr-shop-card-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-draft-idx') || '-1');
            if (idx >= 0) {
                const success = dataEngine.buyDraftItem(idx);
                if (success) {
                    audio.playGate();
                    hud.update(state);
                    showLockerRoom();
                }
            }
        });
    });

    // ── Wire reroll button ──
    document.getElementById('btn-shop-reroll')?.addEventListener('click', () => {
        const success = dataEngine.rerollShopDraft();
        if (success) {
            audio.playTick();
            showLockerRoom();
        }
    });

    // ── Wire Tee Off button ──
    document.getElementById('btn-tee-off')?.addEventListener('click', () => {
        if (isSeasonOver) return;
        audio.playGate();
        overlayContainer.style.display = 'none';
        appContent.style.opacity = '1.0';
        const startIndex = isFirstTime ? 0 : nextTournamentIndex;
        dataEngine.initializeTournament(startIndex);
        dataEngine.setGameMode('play');
        hud.update(state);
    });
}

// ─────────────────────────────────────────────────────────────
// TOUR RESULTS SCREEN — cinematic cut result after 3 holes
// ─────────────────────────────────────────────────────────────
function showTourResultsScreen(passed: boolean, cashEarned: number) {
    overlayContainer.classList.remove('overlay-fullvp');
    overlayContainer.style.display = 'flex';
    appContent.style.opacity = '0.1';
    dataEngine.setGameMode('results');

    const tourney = TOURNAMENT_DATA[state.currentTournamentIndex];
    const score = state.cumulativeTournamentPoints;
    const isSeasonOver = state.currentTournamentIndex >= TOURNAMENT_DATA.length - 1;

    const badgeText   = passed ? (isSeasonOver ? '★ SEASON CHAMPION ★' : '✓ CUT MADE!') : '✗ MISSED CUT';
    const badgeColor  = passed ? (isSeasonOver ? '#ffd32a' : '#2ecc71') : '#e74c3c';
    const badgeGlow   = passed ? (isSeasonOver ? 'rgba(255,211,42,0.8)' : 'rgba(46,204,113,0.6)') : 'rgba(231,76,60,0.5)';
    const bgGradient  = passed ? 'rgba(46,204,113,0.06)' : 'rgba(231,76,60,0.06)';

    overlayContainer.innerHTML = `
        <div class="tr-overlay" id="tr-main" style="background: radial-gradient(ellipse at 50% 0%, ${bgGradient} 0%, rgba(12,8,20,0.98) 60%);">
            <div class="tr-header">
                <div class="tr-subtitle">${tourney.name.toUpperCase()}</div>
                <div class="tr-title" id="tr-title">${passed ? 'TOURNAMENT CLEAR!' : 'MISSED THE CUT'}</div>
                <div class="tr-badge" id="tr-badge" style="color:${badgeColor}; text-shadow: 0 0 20px ${badgeGlow}, 0 0 50px ${badgeGlow};">
                    ${badgeText}
                </div>
            </div>

            <div class="tr-results-card">
                <div class="tr-card-title">── TOURNAMENT RESULTS ──</div>

                <div class="tr-result-row" id="tr-row-score">
                    <span class="tr-row-label">YOUR SCORE</span>
                    <span class="tr-row-val" id="tr-score-val" style="color: ${passed ? 'var(--color-success)' : 'var(--color-danger)'};">0 PTS</span>
                </div>
                <div class="tr-result-row tr-result-row--dim" id="tr-row-cut">
                    <span class="tr-row-label">CUT LINE</span>
                    <span class="tr-row-val" style="color: var(--color-gold);">${tourney.cutTarget.toLocaleString()} PTS</span>
                </div>

                ${passed ? `
                <div class="hc-divider" style="margin: 0.5em 0;"></div>
                <div class="tr-result-row tr-payout-row" id="tr-row-payout">
                    <span class="tr-row-label">PAYOUT EARNED</span>
                    <span class="tr-row-val tr-cash-val" id="tr-cash-val">+$0</span>
                </div>
                ` : `
                <div class="hc-divider" style="margin: 0.5em 0;"></div>
                <div class="tr-result-row" id="tr-row-payout">
                    <span class="tr-row-label">SEASON STATUS</span>
                    <span class="tr-row-val" style="color: var(--color-danger);">ELIMINATED</span>
                </div>
                `}
            </div>

            ${isSeasonOver && passed ? `
            <div class="tr-season-complete" id="tr-season-msg">
                <div class="tr-season-title">🏆 CONGRATULATIONS!</div>
                <div class="tr-season-desc">You've conquered all 8 tournaments and claimed the Bogeyman Trophy! Your illegal bag of clubs is the stuff of legend.</div>
            </div>
            ` : ''}

            <button id="btn-enter-locker" class="screen-btn tr-cta-btn" style="opacity:0; transform:translateY(20px); pointer-events:none;">
                ${passed && isSeasonOver ? 'VIEW FINAL RESULTS' : passed ? 'ENTER LOCKER ROOM ▶' : 'TRY AGAIN'}
            </button>
        </div>
    `;

    // ── Animate the results screen ──
    requestAnimationFrame(() => requestAnimationFrame(() => {
        // Pop title in
        document.getElementById('tr-title')?.classList.add('hc-title--pop');

        // Count up score
        setTimeout(() => {
            const scoreElem = document.getElementById('tr-score-val');
            if (scoreElem) {
                const steps = 35;
                const increment = Math.ceil(score / steps);
                let current = 0;
                let tick = 0;
                const iv = setInterval(() => {
                    current = Math.min(current + increment, score);
                    scoreElem.textContent = `${current.toLocaleString()} PTS`;
                    if (tick % 2 === 0) audio.playScoreTick(500 + tick * 18);
                    tick++;
                    if (current >= score) {
                        clearInterval(iv);
                        // Show badge + cut row
                        document.getElementById('tr-row-cut')?.classList.add('tr-row--visible');
                        setTimeout(() => {
                            const badge = document.getElementById('tr-badge');
                            if (badge) badge.classList.add('hc-badge--visible');
                            if (passed) audio.playParBonus(-1);
                            // Show payout
                            setTimeout(() => {
                                const payoutRow = document.getElementById('tr-row-payout');
                                payoutRow?.classList.add('tr-row--visible');
                                if (passed) {
                                    // Count up cash
                                    const cashElem = document.getElementById('tr-cash-val');
                                    if (cashElem) {
                                        let c = 0;
                                        const cashIv = setInterval(() => {
                                            c = Math.min(c + Math.ceil(cashEarned / 15), cashEarned);
                                            cashElem.textContent = `+$${c}`;
                                            if (c >= cashEarned) {
                                                clearInterval(cashIv);
                                                audio.playCash();
                                            }
                                        }, 40);
                                    }
                                }
                                // Show CTA
                                setTimeout(() => {
                                    document.getElementById('tr-season-msg')?.classList.add('tr-row--visible');
                                    const cta = document.getElementById('btn-enter-locker');
                                    if (cta) {
                                        cta.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.175,0.885,0.32,1.375)';
                                        cta.style.opacity = '1';
                                        cta.style.transform = 'translateY(0)';
                                        cta.style.pointerEvents = 'auto';
                                    }
                                }, 700);
                            }, 500);
                        }, 350);
                    }
                }, 18);
            }
        }, 550);
    }));

    document.getElementById('btn-enter-locker')?.addEventListener('click', () => {
        audio.playGate();
        if (!passed) {
            // Missed cut: full restart
            dataEngine.resetGame();
            canvas.unmount();
            overlayContainer.classList.remove('overlay-fullvp');
            overlayContainer.style.display = 'none';
            appContent.style.opacity = '1.0';
            hud.update(state);
            showTitleScreen();
        } else {
            showLockerRoom('tourmap');
        }
    });
}



function showResolutionOverlay(sunk: boolean, _settleMessage: string) {
    overlayContainer.classList.remove('overlay-fullvp');
    overlayContainer.style.display = 'flex';
    appContent.style.opacity = '0.15';

    const isLastHole = state.currentHoleIndex >= 2;
    const btnLabel = isLastHole ? 'CHECK THE CUT LINE' : 'NEXT HOLE >';

    const scorecard = state.scorecardList[state.currentHoleIndex];
    const parDiff = sunk ? scorecard.strokesTaken - scorecard.par : 999;

    // Determine par rating label and color
    let parLabel = 'DNF';
    let parColor = 'var(--color-danger)';
    let parGlow = 'rgba(192,57,43,0.6)';
    if (sunk) {
        if (parDiff <= -2)       { parLabel = '★ EAGLE ★';    parColor = '#ffd32a'; parGlow = 'rgba(255,211,42,0.8)'; }
        else if (parDiff === -1) { parLabel = '◆ BIRDIE';     parColor = '#00d2d3'; parGlow = 'rgba(0,210,211,0.6)'; }
        else if (parDiff === 0)  { parLabel = '● PAR';        parColor = '#2ecc71'; parGlow = 'rgba(46,204,113,0.5)'; }
        else if (parDiff === 1)  { parLabel = '▽ BOGEY';      parColor = '#e67e22'; parGlow = 'rgba(230,126,34,0.4)'; }
        else                     { parLabel = '▼ DBL BOGEY';  parColor = '#e74c3c'; parGlow = 'rgba(231,76,60,0.4)'; }
    }

    // Build stroke breakdown rows (initially invisible for animation)
    const strokeRows = scorecard.pointsPerShot.map((_, i) => `
        <div class="hc-stroke-row" id="hc-stroke-${i}">
            <span class="hc-stroke-label">SHOT ${i + 1}</span>
            <span class="hc-stroke-pts" id="hc-pts-${i}">+0 PTS</span>
        </div>
    `).join('');

    overlayContainer.innerHTML = `
        <div class="hc-overlay" id="hc-main">
            <div class="hc-header">
                <div class="hc-subtitle">HOLE ${state.currentHoleIndex + 1} &mdash; PAR ${scorecard.par}</div>
                <div class="hc-title ${sunk ? 'hc-title--success' : 'hc-title--fail'}" id="hc-main-title">
                    ${sunk ? 'HOLE COMPLETE!' : 'DREADED DNF!'}
                </div>
                <div class="hc-par-badge" id="hc-par-badge" style="color:${parColor}; text-shadow: 0 0 18px ${parGlow}, 0 0 40px ${parGlow};">
                    ${parLabel}
                </div>
            </div>

            <div class="hc-scorecard">
                <div class="hc-scorecard-title">── SCORECARD ──</div>
                <div class="hc-strokes" id="hc-strokes">
                    ${strokeRows}
                </div>

                <div class="hc-bonus-row" id="hc-bonus-row">
                    <span class="hc-bonus-label">PAR BONUS</span>
                    <span class="hc-bonus-mult" id="hc-bonus-mult" style="color:${parColor};">×?</span>
                </div>

                <div class="hc-divider"></div>

                <div class="hc-total-row">
                    <span class="hc-total-label">HOLE TOTAL</span>
                    <span class="hc-total-pts" id="hc-total-pts">0 PTS</span>
                </div>
            </div>

            <div class="hc-tourney-row" id="hc-tourney-row">
                <span class="hc-tourney-label">TOURNAMENT</span>
                <span class="hc-tourney-pts">${state.cumulativeTournamentPoints.toLocaleString()} PTS</span>
            </div>

            <button id="btn-next-action" class="screen-btn hc-cta-btn">
                ${btnLabel}
            </button>
        </div>
    `;

    // ── Animation sequence ─────────────────────────────────────────────────
    // Start everything hidden via CSS class; JS reveals each element in order
    const TICK_INTERVAL = 16;
    const ROW_DELAY     = 340;

    function countUp(
        elemId: string,
        targetPts: number,
        suffix: string,
        color: string,
        onDone?: () => void
    ) {
        const elem = document.getElementById(elemId);
        if (!elem) { onDone?.(); return; }
        const steps = Math.min(50, Math.max(10, Math.floor(targetPts / 80)));
        const increment = Math.ceil(targetPts / steps);
        let current = 0;
        let tickCount = 0;
        const pitchBase = 500 + Math.min(targetPts / 40, 500);
        const iv = setInterval(() => {
            current = Math.min(current + increment, targetPts);
            elem.textContent = `+${current.toLocaleString()} ${suffix}`;
            elem.style.color = color;
            if (tickCount % 2 === 0) audio.playScoreTick(pitchBase + tickCount * 15);
            tickCount++;
            if (current >= targetPts) { clearInterval(iv); onDone?.(); }
        }, TICK_INTERVAL);
    }

    function revealRow(idx: number, onDone?: () => void) {
        const row = document.getElementById(`hc-stroke-${idx}`);
        if (!row) { onDone?.(); return; }
        row.classList.add('hc-row--visible');
        audio.playTick();
        setTimeout(() => {
            countUp(`hc-pts-${idx}`, scorecard.pointsPerShot[idx], 'PTS', 'var(--color-base)', onDone);
        }, 100);
    }

    function revealParBonus() {
        const bonusRow = document.getElementById('hc-bonus-row');
        const bonusMult = document.getElementById('hc-bonus-mult');
        let multLabel = '×0.8';
        if      (parDiff <= -2) multLabel = '×2.0';
        else if (parDiff === -1) multLabel = '×1.5';
        else if (parDiff === 0)  multLabel = '×1.2';
        else if (parDiff === 1)  multLabel = '×1.0';

        if (bonusRow)  bonusRow.classList.add('hc-row--visible');
        if (bonusMult) bonusMult.textContent = sunk ? multLabel : '×0';
        if (sunk) audio.playParBonus(parDiff);

        setTimeout(() => {
            const badge = document.getElementById('hc-par-badge');
            if (badge) badge.classList.add('hc-badge--visible');
            setTimeout(revealTotal, 420);
        }, 380);
    }

    function revealTotal() {
        countUp('hc-total-pts', scorecard.totalPoints, 'PTS', 'var(--color-gold)', () => {
            setTimeout(() => {
                document.getElementById('hc-tourney-row')?.classList.add('hc-row--visible');
                const ctaBtn = document.getElementById('btn-next-action');
                if (ctaBtn) {
                    ctaBtn.classList.add('hc-cta--visible');
                    ctaBtn.addEventListener('click', handleNextAction);
                }
            }, 400);
        });
    }

    function runAnimationSequence() {
        const shots = scorecard.pointsPerShot;
        const titleEl = document.getElementById('hc-main-title');
        if (titleEl) titleEl.classList.add('hc-title--pop');

        function revealNext(i: number) {
            if (i >= shots.length) { setTimeout(revealParBonus, ROW_DELAY); return; }
            setTimeout(() => revealRow(i, () => revealNext(i + 1)), i === 0 ? 400 : ROW_DELAY);
        }
        revealNext(0);
    }

    function handleNextAction() {
        overlayContainer.style.display = 'none';
        appContent.style.opacity = '1.0';
        if (isLastHole) {
            // Evaluate cut and show the Tour Results screen
            const currentTourney = TOURNAMENT_DATA[state.currentTournamentIndex];
            const passed = state.cumulativeTournamentPoints >= currentTourney.cutTarget;
            const cashEarned = passed ? currentTourney.rewardCash : 0;
            if (passed) dataEngine.earnCash(cashEarned);
            dataEngine.saveTournamentResult(passed, cashEarned);
            // Generate shop draft only if passed
            if (passed) dataEngine.generateShopDraft();
            showTourResultsScreen(passed, cashEarned);
        } else {
            dataEngine.loadHole(state.currentHoleIndex + 1);
            hud.update(state);
        }
    }

    requestAnimationFrame(() => requestAnimationFrame(runAnimationSequence));
}


// ----------------------------------------------------
// 3. Animation Ticker loop
// ----------------------------------------------------
function ticker() {
    if (state.gameMode === 'play') {
        if (state.ball.isMoving) {
            const mapGrid = TOURNAMENT_DATA[state.currentTournamentIndex].holes[state.currentHoleIndex].map;
            
            physicsEngine.updateFrame(
                state.ball,
                state.currentFrame!,
                mapGrid,
                state.activeSleeve.elasticity,
                state.wind,
                state.activeSleeve.windImmunity
            );

            // Trigger HUD redraw during movement to animate points accumulating
            hud.update(state);

            // Physics Stopped. Evaluate settle phase.
            if (!state.ball.isMoving) {
                const settleResult = evaluationEngine.settleStroke(state);

                // Floaters
                canvas.spawnTextPop(
                    state.ball.pos.x,
                    state.ball.pos.y,
                    settleResult.wasSunk ? 'SUNK!' : `+${settleResult.points} yds`,
                    settleResult.wasSunk ? 'var(--color-gold)' : 'var(--color-base)'
                );

                hud.update(state);

                // Transitions
                if (settleResult.wasSunk) {
                    canvas.spawnSparks(state.ball.pos.x, state.ball.pos.y, 'var(--color-gold)', 24);
                    canvas.triggerShake(45, 8);
                    
                    // Small delay before showing resolution modal so sparks can fly
                    setTimeout(() => {
                        showResolutionOverlay(true, settleResult.logText);
                    }, 500);
                } else if (settleResult.wasDnf) {
                    canvas.spawnSparks(state.ball.pos.x, state.ball.pos.y, 'var(--color-danger)', 24);
                    canvas.triggerShake(35, 6);
                    setTimeout(() => {
                        showResolutionOverlay(false, settleResult.logText);
                    }, 500);
                }
            }
        }

        // Render Canvas layout
        canvas.render(state);
    }

    requestAnimationFrame(ticker);
}

// ----------------------------------------------------
// 4. Developer Debug overlay controls
// ----------------------------------------------------

function toggleDebugPanel() {
    let panel = document.getElementById('dev-debug-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        return;
    }

    // Mount panel
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

    // Bind triggers
    document.getElementById('db-win')?.addEventListener('click', () => {
        if (state.gameMode === 'play') {
            // Find cup location in map grid and teleport ball there
            const mapGrid = TOURNAMENT_DATA[state.currentTournamentIndex].holes[state.currentHoleIndex].map;
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

            // Fire off a dummy settlement frame
            if (!state.currentFrame) {
                state.currentFrame = evaluationEngine.initializeStrokeFrame(state);
            }
            state.currentFrame.accumulatedBaseYards = 250;
            state.currentFrame.accumulatedMultiplier = 4.0;
            
            // Settle!
            const res = evaluationEngine.settleStroke(state);
            showResolutionOverlay(true, res.logText);
            hud.update(state);
        }
    });

    document.getElementById('db-cash')?.addEventListener('click', () => {
        dataEngine.earnCash(500);
        hud.update(state);
        canvas.spawnTextPop(256, 192, '+$500 Cash Cheat!', 'var(--color-gold)');
        if (state.gameMode === 'locker') showLockerRoom();
    });

    document.getElementById('db-mulligan')?.addEventListener('click', () => {
        state.mulligansLeft++;
        hud.update(state);
        canvas.spawnTextPop(256, 192, '+1 Mulligan Cheat!', 'var(--color-mult)');
    });

    document.getElementById('db-immune')?.addEventListener('click', () => {
        state.activeSleeve.windImmunity = !state.activeSleeve.windImmunity;
        hud.update(state);
        canvas.spawnTextPop(256, 192, `Wind Immunity: ${state.activeSleeve.windImmunity ? 'ON' : 'OFF'}`, 'var(--color-base)');
    });
}

function resizeCabinetLayout() {
    const cabinet = document.getElementById('main-cabinet');
    const wrapper = document.getElementById('game-canvas-container');
    const hudPanel = document.querySelector('.hud-panel') as HTMLElement;
    if (!cabinet || !wrapper) return;

    // Always fill the screen
    cabinet.style.position = 'fixed';
    cabinet.style.top = '0';
    cabinet.style.left = '0';
    cabinet.style.width = '100vw';
    cabinet.style.height = '100vh';
    cabinet.style.maxWidth = 'none';
    cabinet.style.border = 'none';
    cabinet.style.borderRadius = '0';
    cabinet.style.margin = '0';
    cabinet.style.boxShadow = 'none';
    cabinet.style.padding = '1.5em';

    const isMobile = window.innerWidth <= 768;
    const sidebarWidth = isMobile ? 180 : Math.max(300, Math.round(window.innerWidth * 0.20));

    // Fix HUD container to the right side of the screen
    const hudContainer = document.getElementById('game-hud-container');
    if (hudContainer) {
        hudContainer.style.position = 'fixed';
        hudContainer.style.top = isMobile ? '12px' : '24px';
        hudContainer.style.right = isMobile ? '12px' : '24px';
        hudContainer.style.bottom = isMobile ? '12px' : '24px';
        hudContainer.style.width = `${sidebarWidth}px`;
        hudContainer.style.height = 'auto';
        hudContainer.style.zIndex = '10';
        hudContainer.style.display = 'flex';
    }

    const playWrapper = appContent.firstElementChild as HTMLElement;
    if (playWrapper) {
        playWrapper.style.display = 'flex';
        playWrapper.style.flexDirection = 'column';
        playWrapper.style.alignItems = 'center';
        playWrapper.style.justifyContent = 'center';
        playWrapper.style.height = '100%';
        playWrapper.style.width = `calc(100% - ${sidebarWidth + (isMobile ? 16 : 32)}px)`;
        playWrapper.style.marginRight = `${sidebarWidth + (isMobile ? 16 : 32)}px`;
    }

    // Compute max bounds with a 0.8x scale multiplier for extra space/margins around play field
    const scaleMultiplier = 0.8;
    const gapAndMargins = isMobile ? 40 : 80;
    const availWidth = (window.innerWidth - sidebarWidth - gapAndMargins) * scaleMultiplier;
    const availHeight = (window.innerHeight - gapAndMargins) * scaleMultiplier;

    let w = availWidth;
    let h = w * 3 / 4;
    if (h > availHeight) {
        h = availHeight;
        w = h * 4 / 3;
    }

    wrapper.style.width = `${Math.round(w)}px`;
    wrapper.style.height = `${Math.round(h)}px`;

    if (hudPanel) {
        hudPanel.style.width = '100%';
        hudPanel.style.height = '100%';
    }

    // Proportional fonts — scale with canvas width, no hard cap for large screens
    const fontSize = Math.max(12, Math.round(w / 26));
    cabinet.style.fontSize = `${fontSize}px`;
}

function initBackgroundSpiral() {
    const bgCanvas = document.getElementById('bg-spiral-canvas') as HTMLCanvasElement;
    if (!bgCanvas) return;
    const bgCtx = bgCanvas.getContext('2d')!;

    function resizeBg() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        resizeCabinetLayout();
    }
    window.addEventListener('resize', resizeBg);
    resizeBg();

    let rotationAngle = 0;
    
    // We can define a set of spiral stars/particles for texture
    const particles: { angle: number; radius: number; size: number; color: string }[] = [];
    // Cozy warm and starry cosmic choices
    const colorChoices = ['#5f27cd', '#341f97', '#d35400', '#f1c40f', '#f39c12', '#706fd3', '#2c3e50'];
    
    for (let i = 0; i < 220; i++) {
        // Spiral arms distribution
        const arm = (i % 3) * (Math.PI * 2 / 3);
        const radius = Math.random() * 550 + 20;
        // Spiral formula: angle is proportional to radius
        const angle = arm + (radius * 0.012) + (Math.random() * 0.25 - 0.125);
        particles.push({
            angle,
            radius,
            size: Math.random() * 3.5 + 1.5,
            color: colorChoices[Math.floor(Math.random() * colorChoices.length)]
        });
    }

    function drawSpiral() {
        rotationAngle += 0.0015;
        
        // Dark cosmic space wash trail
        bgCtx.fillStyle = 'rgba(12, 8, 19, 0.15)'; 
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

        const cx = bgCanvas.width / 2;
        const cy = bgCanvas.height / 2;

        bgCtx.save();
        
        // Draw soft glowing core
        const grad = bgCtx.createRadialGradient(cx, cy, 0, cx, cy, 220);
        grad.addColorStop(0, 'rgba(211, 84, 0, 0.12)'); // warm orange core glow
        grad.addColorStop(0.5, 'rgba(95, 39, 205, 0.06)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        bgCtx.fillStyle = grad;
        bgCtx.beginPath();
        bgCtx.arc(cx, cy, 220, 0, Math.PI * 2);
        bgCtx.fill();

        // Draw pixelated star clusters
        particles.forEach(p => {
            const currentAngle = p.angle + rotationAngle;
            const x = cx + Math.cos(currentAngle) * p.radius;
            const y = cy + Math.sin(currentAngle) * p.radius;

            // Draw pixel star
            bgCtx.fillStyle = p.color;
            const flicker = Math.sin(rotationAngle * 15 + p.radius) * 0.35 + 0.65;
            bgCtx.globalAlpha = flicker;
            
            const s = Math.round(p.size);
            bgCtx.fillRect(Math.round(x), Math.round(y), s, s);
        });

        bgCtx.restore();
        requestAnimationFrame(drawSpiral);
    }
    
    requestAnimationFrame(drawSpiral);
}

// Start game on window load
window.addEventListener('DOMContentLoaded', () => {
    init();
});
