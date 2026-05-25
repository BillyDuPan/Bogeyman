import { audio } from '../engine/AudioSynthesizer';
import { TOURNAMENT_DATA } from '../config/terrain';
import type { DataEngine } from '../engine/DataEngine';
import type { ScoreHUD } from './ScoreHUD';
import type { GameCanvas } from './GameCanvas';

interface ResultsContext {
    dataEngine: DataEngine;
    hud: ScoreHUD;
    canvas: GameCanvas;
    overlayContainer: HTMLElement;
    appContent: HTMLElement;
    showLockerRoom: (tab?: 'loadout' | 'shop' | 'tourmap') => void;
    showTitleScreen: () => void;
}

let context: ResultsContext | null = null;

export function setupResultsOverlay(ctx: ResultsContext) {
    context = ctx;
}

export function spawnResolutionConfetti(container: HTMLElement, count: number = 80) {
    const colors = ['#00d2d3', '#fd79a8', '#f1c40f', '#2ecc71', '#e84118'];
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const size = 6 + Math.random() * 10;
        
        particle.style.background = color;
        particle.style.left = `${left}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.animationDelay = `${delay}s`;
        
        if (Math.random() > 0.5) {
            particle.style.borderRadius = '50%';
        }
        
        container.appendChild(particle);
    }
}

export function burstTextParticles(elemId: string, color: string = 'var(--color-base)') {
    const elem = document.getElementById(elemId);
    if (!elem) return;
    
    const rect = elem.getBoundingClientRect();
    const overlay = document.getElementById('game-overlay-container');
    if (!overlay) return;
    const parentRect = overlay.getBoundingClientRect();
    
    const centerX = rect.left + rect.width / 2 - parentRect.left;
    const centerY = rect.top + rect.height / 2 - parentRect.top;
    
    const count = 36;
    for (let i = 0; i < count; i++) {
        const spark = document.createElement('div');
        spark.className = 'text-spark';
        spark.style.background = color;
        spark.style.left = `${centerX}px`;
        spark.style.top = `${centerY}px`;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 90;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        spark.style.setProperty('--tx', `${tx}px`);
        spark.style.setProperty('--ty', `${ty}px`);
        spark.style.animationDelay = `${Math.random() * 0.08}s`;
        
        overlay.appendChild(spark);
    }
}

export function showTourResultsScreen(passed: boolean, cashEarned: number) {
    if (!context) return;
    const { dataEngine, canvas, hud, overlayContainer, appContent, showLockerRoom, showTitleScreen } = context;
    const state = dataEngine.getState();

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

export function showResolutionOverlay(sunk: boolean, _settleMessage: string) {
    if (!context) return;
    const { dataEngine, hud, overlayContainer, appContent } = context;
    const state = dataEngine.getState();

    overlayContainer.classList.remove('overlay-fullvp');
    overlayContainer.style.display = 'flex';
    appContent.style.opacity = '0.15';

    const isLastHole = state.currentHoleIndex >= 2;
    const btnLabel = isLastHole ? 'CHECK THE CUT LINE' : 'NEXT HOLE >';

    const scorecard = state.scorecardList[state.currentHoleIndex];
    const currentTourney = TOURNAMENT_DATA[state.currentTournamentIndex];
    const holeDef = currentTourney.holes[state.currentHoleIndex];
    const holeName = holeDef ? holeDef.name : `HOLE ${state.currentHoleIndex + 1}`;

    const parDiff = sunk ? scorecard.strokesTaken - scorecard.par : 999;
    const isHoleInOne = scorecard.strokesTaken === 1;

    // Determine par rating label and color
    let parLabel = 'DNF';
    let parColor = 'var(--color-danger)';
    let parGlow = 'rgba(192,57,43,0.6)';
    if (sunk) {
        if (isHoleInOne)         { parLabel = '👑 ACE 👑'; parColor = '#f1c40f'; parGlow = 'rgba(241,196,15,0.9)'; }
        else if (parDiff <= -2)  { parLabel = '★ EAGLE ★';    parColor = '#ffd32a'; parGlow = 'rgba(255,211,42,0.8)'; }
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
                <div class="hc-subtitle">HOLE ${state.currentHoleIndex + 1}: ${holeName.toUpperCase()} &mdash; PAR ${scorecard.par}</div>
                <div class="hc-title ${sunk ? 'hc-title--success' : 'hc-title--fail'}" id="hc-main-title">
                    ${sunk ? (isHoleInOne ? 'HOLE IN ONE!' : 'HOLE COMPLETE!') : 'DREADED DNF!'}
                </div>
                <div class="hc-par-badge ${isHoleInOne ? 'hole-in-one-celebrate' : ''}" id="hc-par-badge" style="color:${parColor}; text-shadow: 0 0 18px ${parGlow}, 0 0 40px ${parGlow};">
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

    // Confetti celebration trigger
    if (sunk) {
        spawnResolutionConfetti(overlayContainer, isHoleInOne ? 150 : 80);
    }

    // ── Animation sequence ─────────────────────────────────────────────────
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
        if      (isHoleInOne)    multLabel = '×3.0';
        else if (parDiff <= -2)  multLabel = '×2.0';
        else if (parDiff === -1) multLabel = '×1.5';
        else if (parDiff === 0)  multLabel = '×1.2';
        else if (parDiff === 1)  multLabel = '×1.0';

        if (bonusRow)  bonusRow.classList.add('hc-row--visible');
        if (bonusMult) bonusMult.textContent = sunk ? multLabel : '×0';
        if (sunk) {
            if (isHoleInOne) {
                audio.playHoleInOneFanfare();
            } else {
                audio.playParBonus(parDiff);
            }
        }

        setTimeout(() => {
            const badge = document.getElementById('hc-par-badge');
            if (badge) {
                badge.classList.add('hc-badge--visible');
                // Shoot sparks from par badge text as it pops onto the screen!
                burstTextParticles('hc-par-badge', parColor);
            }
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
        if (titleEl) {
            titleEl.classList.add('hc-title--pop');
            burstTextParticles('hc-main-title', sunk ? 'var(--color-success)' : 'var(--color-danger)');
        }

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
            const currentTourney = TOURNAMENT_DATA[state.currentTournamentIndex];
            const passed = state.cumulativeTournamentPoints >= currentTourney.cutTarget;
            const cashEarned = passed ? currentTourney.rewardCash : 0;
            if (passed) dataEngine.earnCash(cashEarned);
            dataEngine.saveTournamentResult(passed, cashEarned);
            if (passed) dataEngine.generateShopDraft();
            showTourResultsScreen(passed, cashEarned);
        } else {
            dataEngine.loadHole(state.currentHoleIndex + 1);
            hud.update(state);
        }
    }

    requestAnimationFrame(() => requestAnimationFrame(runAnimationSequence));
}
