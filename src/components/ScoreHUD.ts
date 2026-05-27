import type { GameState } from '../types/game';
import { audio } from '../engine/AudioSynthesizer';
import { TOURNAMENT_DATA } from '../config/terrain';
import { DRAFTABLE_SLEEVES } from '../config/items';


export class ScoreHUD {
    private container: HTMLElement | null = null;
    private onClubSelect: ((id: string) => void) | null = null;
    private onSleeveSelect: ((id: string) => void) | null = null;
    private onMulligan: (() => void) | null = null;
    private onDrop: (() => void) | null = null;
    private onBlockSelect: ((tileId: number | null) => void) | null = null;
    private onReclaimAll: (() => void) | null = null;

    // Dopamine counter tracking states
    private displayedCurrentPoints = 0;
    private displayedTotalPoints = 0;
    private displayedMultiplier = 1.00;

    initialize(
        container: HTMLElement,
        handlers: {
            onClubSelect: (id: string) => void;
            onSleeveSelect: (id: string) => void;
            onMulligan: () => void;
            onDrop: () => void;
            onBlockSelect: (tileId: number | null) => void;
            onReclaimAll: () => void;
        }
    ) {
        this.container = container;
        this.onClubSelect = handlers.onClubSelect;
        this.onSleeveSelect = handlers.onSleeveSelect;
        this.onMulligan = handlers.onMulligan;
        this.onDrop = handlers.onDrop;
        this.onBlockSelect = handlers.onBlockSelect;
        this.onReclaimAll = handlers.onReclaimAll;
        
        // Render base shell skeleton
        this.container.innerHTML = `
            <div class="hud-panel">
                <!-- Point values scoreboard -->
                <div class="hud-block">
                    <div class="hud-score-row">
                        <div class="hud-title">Stroke Pts</div>
                        <div class="hud-title">Target Cut</div>
                    </div>
                    <div class="hud-score-row">
                        <div id="hud-points-current" class="hud-value-large base">0</div>
                        <div id="hud-points-target" class="hud-value-large" style="color: var(--color-gold);">/ 800</div>
                    </div>
                    <div style="font-size: clamp(10px, 1.1vw, 12px); opacity: 0.75; margin-top: 4px;" id="hud-points-total">
                        Season: <span id="hud-points-total-num" style="font-family: var(--font-arcade); color: var(--color-gold);">0</span> / <span id="hud-points-goal-num" style="font-family: var(--font-arcade);">0</span>
                    </div>
                </div>

                <!-- Hand strokes & mulligans values -->
                <div class="hud-block" style="display: flex; gap: 10px;">
                    <div style="flex: 1;">
                        <div class="hud-title">Strokes</div>
                        <div id="hud-strokes" class="hud-value-large">4</div>
                    </div>
                    <div style="flex: 1; border-left: 1px solid var(--border-neon); padding-left: 10px;">
                        <div class="hud-title">Mulligans</div>
                        <div id="hud-mulligans" class="hud-value-large" style="color: var(--color-mult);">1</div>
                    </div>
                </div>

                <!-- Current active Lie multiplier -->
                <div class="hud-block">
                    <div class="hud-title">Lie / Multiplier</div>
                    <div id="hud-lie-type" style="font-size: clamp(11px, 1.3vw, 14px); font-weight: 700; margin-bottom: 4px; color: #fff;">TEE BOX</div>
                    <div id="hud-multiplier" class="hud-value-large mult">1.50x</div>
                </div>

                <!-- Bag Selection Panel -->
                <div class="hud-block" style="flex-grow: 1; display: flex; flex-direction: column;">
                    <div class="hud-title" style="margin-bottom: 6px;">Club Select</div>
                    <div id="club-list" class="club-grid">
                        <!-- Populated dynamically -->
                    </div>
                </div>

                <!-- Spirit Ball Sleeve Switcher -->
                <div class="hud-block" style="flex-grow: 1; display: flex; flex-direction: column;">
                    <div class="hud-title" style="margin-bottom: 6px;">Spirit Ball</div>
                    <div id="sleeve-switcher" class="club-grid"></div>
                </div>

                <!-- Placeable Map Upgrades -->
                <div class="hud-block">
                    <div class="hud-title" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Map Upgrades</span>
                        <button id="btn-reclaim-all" class="reclaim-btn" title="Reclaim all placed blocks">RECLAIM</button>
                    </div>
                    <div id="block-inventory-list" class="club-grid">
                        <!-- Populated dynamically -->
                    </div>
                </div>

                <!-- Consumable Action triggers -->
                <div class="action-buttons">
                    <button id="btn-mulligan" class="action-btn">
                        <span>Mulligan</span>
                        <span class="count" id="count-mulligan">Charges: 0</span>
                    </button>
                    <button id="btn-drop" class="action-btn">
                        <span>Take Drop</span>
                        <span class="count" style="color: var(--color-danger);">-500 pts</span>
                    </button>
                </div>
            </div>
        `;

        // Wire up buttons
        const mullBtn = document.getElementById('btn-mulligan');
        mullBtn?.addEventListener('click', () => {
            if (this.onMulligan) this.onMulligan();
        });

        const dropBtn = document.getElementById('btn-drop');
        dropBtn?.addEventListener('click', () => {
            if (this.onDrop) this.onDrop();
        });

        const reclaimBtn = document.getElementById('btn-reclaim-all');
        reclaimBtn?.addEventListener('click', () => {
            if (this.onReclaimAll) this.onReclaimAll();
        });
    }

    private animateNumber(
        element: HTMLElement,
        start: number,
        end: number,
        durationMs: number,
        formatFn: (val: number) => string,
        isTotalPoints: boolean = false
    ) {
        const startTime = performance.now();
        
        // Apply visual dopamine Pop class
        element.classList.remove('dopamine-pop');
        void element.offsetWidth; // Reflow reset
        element.classList.add('dopamine-pop');
        
        let lastBlipVal = start;
        const totalDelta = Math.abs(end - start);
        const steps = Math.min(totalDelta, 15); // play at most 15 blips
        const blipThreshold = totalDelta / steps;

        const step = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // Ease out quad
            const ease = progress * (2 - progress);
            const currentVal = start + (end - start) * ease;
            
            element.textContent = formatFn(currentVal);
            
            // Play tick blip sound based on score increments
            if (Math.abs(currentVal - lastBlipVal) >= blipThreshold && currentVal !== end) {
                audio.playTick();
                lastBlipVal = currentVal;
            }
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = formatFn(end);
                if (isTotalPoints && end > start) {
                    audio.playCash();
                }
                setTimeout(() => {
                    element.classList.remove('dopamine-pop');
                }, 400);
            }
        };
        requestAnimationFrame(step);
    }

    update(state: GameState) {
        if (!this.container) return;

        // Dynamic title update
        const mainHeading = document.getElementById('main-heading');
        const arcadeSubtitle = document.querySelector('.arcade-header .arcade-subtitle') as HTMLElement;
        if (state.gameMode === 'play') {
            const currentTourney = TOURNAMENT_DATA[state.currentTournamentIndex];
            const scorecard = state.scorecardList[state.currentHoleIndex];
            const parVal = scorecard ? scorecard.par : 3;
            const holeDef = currentTourney.holes[state.currentHoleIndex];
            const holeName = holeDef ? holeDef.name : `HOLE ${state.currentHoleIndex + 1}`;

            if (mainHeading) {
                mainHeading.textContent = `TOUR ${state.currentTournamentIndex + 1}: ${currentTourney.name.toUpperCase()}`;
            }
            if (arcadeSubtitle) {
                arcadeSubtitle.innerHTML = `
                    <div style="font-size: 0.85em; color: var(--color-base); margin-bottom: 4px; letter-spacing: 1px;">HOLE ${state.currentHoleIndex + 1}: ${holeName.toUpperCase()}</div>
                    <div style="font-size: 0.65em; color: var(--color-gold); letter-spacing: 1.5px;">PAR ${parVal} &nbsp;|&nbsp; CASH: $${state.money}</div>
                `;
            }
        } else {
            if (mainHeading) {
                mainHeading.textContent = 'MULLIGAN MANIA';
            }
            if (arcadeSubtitle) {
                arcadeSubtitle.textContent = 'Neon Score-Builder Mini-Golf';
            }
        }


        // Current shot points tracking
        const targetCurrentPoints = state.currentFrame 
            ? Math.floor(state.currentFrame.accumulatedBaseYards * state.currentFrame.accumulatedMultiplier)
            : 0;

        const pointsElem = document.getElementById('hud-points-current');
        if (pointsElem) {
            if (targetCurrentPoints !== this.displayedCurrentPoints) {
                this.animateNumber(pointsElem, this.displayedCurrentPoints, targetCurrentPoints, 600, (val) => Math.floor(val).toLocaleString());
                this.displayedCurrentPoints = targetCurrentPoints;
            } else {
                pointsElem.textContent = targetCurrentPoints.toLocaleString();
            }
        }

        // Target cut indicator
        const targetElem = document.getElementById('hud-points-target');
        if (targetElem) {
            targetElem.textContent = `/ ${state.scorecardList[state.currentHoleIndex]?.targetScore || 0}`;
        }

        // Total season points score
        const goalElem = document.getElementById('hud-points-goal-num');
        if (goalElem) {
            const goalTarget = state.scorecardList.reduce((a, b) => a + b.targetScore, 0);
            goalElem.textContent = goalTarget.toLocaleString();
        }

        const targetTotalPoints = state.cumulativeTournamentPoints;
        const totalNumElem = document.getElementById('hud-points-total-num');
        if (totalNumElem) {
            if (targetTotalPoints !== this.displayedTotalPoints) {
                this.animateNumber(totalNumElem, this.displayedTotalPoints, targetTotalPoints, 800, (val) => Math.floor(val).toLocaleString(), true);
                this.displayedTotalPoints = targetTotalPoints;
            } else {
                totalNumElem.textContent = targetTotalPoints.toLocaleString();
            }
        }

        // Strokes remaining
        const strokesElem = document.getElementById('hud-strokes');
        if (strokesElem) {
            const currentStrokesText = strokesElem.textContent || '';
            const newStrokesText = state.allowedStrokes.toString();
            if (currentStrokesText !== newStrokesText) {
                strokesElem.textContent = newStrokesText;
                // Pop effect for strokes remaining
                strokesElem.classList.remove('dopamine-pop');
                void strokesElem.offsetWidth;
                strokesElem.classList.add('dopamine-pop');
                audio.playTick();
            }
            if (state.allowedStrokes <= 1) {
                strokesElem.style.color = 'var(--color-danger)';
            } else {
                strokesElem.style.color = '#ffffff';
            }
        }

        // Mulligans remaining
        const mulligansElem = document.getElementById('hud-mulligans');
        if (mulligansElem) {
            mulligansElem.textContent = state.mulligansLeft.toString();
        }

        // Lie state indicator
        const lieElem = document.getElementById('hud-lie-type');
        const multElem = document.getElementById('hud-multiplier');
        if (state.currentFrame) {
            const lieTypes = ['TEE BOX', 'FAIRWAY', 'HEAVY ROUGH', 'SAND BUNKER', 'WATER HAZARD', 'THE CUP', 'GREEN'];
            const currentLieName = lieTypes[state.currentFrame.initialLieType] || 'UNKNOWN';
            
            if (lieElem) {
                lieElem.textContent = currentLieName;
                if (state.currentFrame.initialLieType === 3) lieElem.style.color = '#f5cd79'; // bunker
                else if (state.currentFrame.initialLieType === 2) lieElem.style.color = '#3867d6'; // rough
                else if (state.currentFrame.initialLieType === 4) lieElem.style.color = '#eb3b5a'; // water
                else if (state.currentFrame.initialLieType === 6) lieElem.style.color = '#26de81'; // green
                else lieElem.style.color = '#ffffff';
            }

            const targetMultiplier = state.currentFrame.accumulatedMultiplier;
            if (multElem) {
                if (Math.abs(targetMultiplier - this.displayedMultiplier) > 0.005) {
                    this.animateNumber(multElem, this.displayedMultiplier, targetMultiplier, 400, (val) => `${val.toFixed(2)}x`);
                    this.displayedMultiplier = targetMultiplier;
                } else {
                    multElem.textContent = `${targetMultiplier.toFixed(2)}x`;
                }
            }
        } else {
            if (lieElem) lieElem.textContent = 'ADDRESSING BALL';
            if (multElem) {
                multElem.textContent = '---';
                this.displayedMultiplier = 1.00;
            }
        }

        // Spirit Ball sleeve display & switcher
        const switcherElem = document.getElementById('sleeve-switcher');
        if (switcherElem && state.inventorySleeves.length > 0) {
            switcherElem.style.display = 'grid';
            const html = state.inventorySleeves.map(id => {
                const sleeve = DRAFTABLE_SLEEVES.find(s => s.id === id);
                if (!sleeve) return '';
                const isSelected = state.activeSleeve.id === id;
                const classStr = isSelected ? 'club-grid-item selected' : 'club-grid-item';
                const abbr = sleeve.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
                return `
                    <div class="${classStr}" data-sleeve-id="${id}">
                        <span class="club-abbr">${abbr}</span>
                        <div class="club-tooltip">
                            <span class="club-tooltip-name">${sleeve.name}</span>
                            <span class="club-tooltip-desc">${sleeve.description}</span>
                            <span class="club-tooltip-power">E: ${sleeve.elasticity.toFixed(2)}${sleeve.windImmunity ? ' | Wind Immune' : ''}</span>
                        </div>
                    </div>`;
            }).join('');
            if (switcherElem.innerHTML !== html) {
                switcherElem.innerHTML = html;
                switcherElem.querySelectorAll('.club-grid-item').forEach(chip => {
                    chip.addEventListener('click', () => {
                        const id = chip.getAttribute('data-sleeve-id');
                        if (id && this.onSleeveSelect) this.onSleeveSelect(id);
                    });
                });
            }
        } else if (switcherElem) {
            switcherElem.style.display = 'none';
        }

        // Mulligan button disabled states
        const btnMulligan = document.getElementById('btn-mulligan') as HTMLButtonElement;
        const countMulligan = document.getElementById('count-mulligan');
        if (btnMulligan && countMulligan) {
            btnMulligan.disabled = state.mulligansLeft <= 0 || state.mulliganHistory.length === 0 || (state.ball.isMoving);
            countMulligan.textContent = `Charges: ${state.mulligansLeft}`;
        }

        // Take Drop button disabled states (only available when in Water or out of bounds)
        const btnDrop = document.getElementById('btn-drop') as HTMLButtonElement;
        if (btnDrop) {
            const isHazard = state.ball.currentTileId === 4; // Water
            btnDrop.disabled = !isHazard || state.ball.isMoving || state.allowedStrokes <= 0;
        }

        // Re-populate club selection bag
        const clubListElem = document.getElementById('club-list');
        if (clubListElem) {
            const htmlBuffer = state.activeBag.map(club => {
                // Determine if this club is currently usable
                const isSelected = state.selectedClubId === club.id;
                const isPutter = club.clubType === 'Putter';
                const onGreen = state.ball.currentTileId === 6; // Green
                const isUsable = !isPutter || onGreen;

                const disabledAttr = isUsable ? '' : 'style="opacity: 0.3; cursor: not-allowed;"';
                const classStr = isSelected ? 'club-grid-item selected' : 'club-grid-item';
                const abbr = this.getClubAbbreviation(club.name);

                return `
                    <div class="${classStr}" data-id="${club.id}" ${disabledAttr}>
                        <span class="club-abbr">${abbr}</span>
                        <div class="club-tooltip">
                            <span class="club-tooltip-name">${club.name}</span>
                            <span class="club-tooltip-desc">${club.description}</span>
                            <span class="club-tooltip-power">${club.powerScalar.toFixed(1)}x Power</span>
                        </div>
                    </div>
                `;
            }).join('');

            clubListElem.innerHTML = htmlBuffer;

            // Attach listeners to club cards
            const cards = clubListElem.querySelectorAll('.club-grid-item');
            cards.forEach(card => {
                card.addEventListener('click', () => {
                    const id = card.getAttribute('data-id');
                    if (id && this.onClubSelect) {
                        // Check if putter selection rules are respected
                        const club = state.activeBag.find(c => c.id === id);
                        if (club && club.clubType === 'Putter' && state.ball.currentTileId !== 6) {
                            // Do not allow selecting putter off green
                            return;
                        }
                        this.onClubSelect(id);
                    }
                });
            });
        }

        // Re-populate block inventory upgrades list
        const blockListElem = document.getElementById('block-inventory-list');
        if (blockListElem) {
            let diagChar = '◤';
            if (state.buildModeTileId === 13) diagChar = '◥';
            if (state.buildModeTileId === 14) diagChar = '◣';
            if (state.buildModeTileId === 15) diagChar = '◢';

            const BLOCK_INFOS = [
                { tileId: 8, char: '🔴', name: 'Bumper' },
                { tileId: 9, char: '🟣', name: 'Gate' },
                { tileId: 6, char: '🟢', name: 'Green' },
                { tileId: 1, char: '🟩', name: 'Fairway' },
                { tileId: 12, char: diagChar, name: 'Diagonal Wall' }
            ];

            const activeBlocks = BLOCK_INFOS.filter(info => (state.blockInventory[info.tileId] || 0) > 0 || (info.tileId === 12 && state.buildModeTileId !== null && state.buildModeTileId >= 12 && state.buildModeTileId <= 15) || state.buildModeTileId === info.tileId);

            let htmlBuffer = '';
            if (activeBlocks.length === 0) {
                htmlBuffer = `<div style="padding: 10px; color: #666; font-size: 10px; font-family: var(--font-ui); text-align: center; width: 100%;">No blocks owned.<br>Buy some in the Pro Shop!</div>`;
            } else {
                htmlBuffer = activeBlocks.map(info => {
                    const count = state.blockInventory[info.tileId] || 0;
                    const isSelected = state.buildModeTileId === info.tileId || (info.tileId === 12 && state.buildModeTileId !== null && state.buildModeTileId >= 12 && state.buildModeTileId <= 15);
                    const classStr = isSelected ? 'club-grid-item selected' : 'club-grid-item';
    
                    return `
                        <div class="${classStr}" data-tile-id="${isSelected ? state.buildModeTileId : info.tileId}" style="flex-direction: column;">
                            <span class="block-chip-icon">${info.char}</span>
                            <span class="block-chip-count">x${count}</span>
                            <div class="club-tooltip">
                                <span class="club-tooltip-name">${info.name}</span>
                                <span class="club-tooltip-desc">Placeable Map Upgrade${info.tileId === 12 ? '<br><span style="color:var(--color-gold);">Press R to rotate!</span>' : ''}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            blockListElem.innerHTML = htmlBuffer;

            // Attach listeners to block inventory chips
            blockListElem.querySelectorAll('.club-grid-item').forEach(chip => {
                chip.addEventListener('click', () => {
                    const tileId = parseInt(chip.getAttribute('data-tile-id') || '-1');
                    if (tileId !== -1) {
                        const count = state.blockInventory[tileId] || 0;
                        if (count > 0 || state.buildModeTileId === tileId) {
                            audio.playTick();
                            // Toggle Build Mode selection
                            const newVal = state.buildModeTileId === tileId ? null : tileId;
                            if (this.onBlockSelect) this.onBlockSelect(newVal);
                        }
                    }
                });
            });
        }

        const reclaimBtn = document.getElementById('btn-reclaim-all') as HTMLButtonElement;
        if (reclaimBtn) {
            reclaimBtn.disabled = !state.placedBlocks || state.placedBlocks.length === 0 || state.ball.isMoving;
        }
    }

    private getClubAbbreviation(name: string): string {
        const lower = name.toLowerCase();
        if (lower.includes('driver')) return 'DR';
        if (lower.includes('putter')) return 'PT';
        if (lower.includes('sand wedge')) return 'SW';
        if (lower.includes('trick wedge')) return 'TW';
        if (lower.includes('standard wedge')) return 'W';
        if (lower.includes('wedge')) return 'W';
        if (lower.includes('1-iron') || lower.includes('1 iron')) return '1I';
        if (lower.includes('5-iron') || lower.includes('5 iron')) return '5I';
        if (lower.includes('9-iron') || lower.includes('9 iron')) return '9I';
        if (lower.includes('hybrid')) return 'HB';
        if (lower.includes('wood')) {
            if (lower.includes('3')) return '3W';
            if (lower.includes('5')) return '5W';
            return 'WD';
        }
        return name.substring(0, 2).toUpperCase();
    }
}
