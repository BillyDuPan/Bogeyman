import { audio } from '../engine/AudioSynthesizer';
import { DRAFTABLE_SLEEVES } from '../config/items';
import { TOURNAMENT_DATA } from '../config/terrain';
import { stopTutorialTypewriter } from './HowToPlay';
import type { DataEngine } from '../engine/DataEngine';
import type { ScoreHUD } from './ScoreHUD';

interface LockerRoomContext {
    dataEngine: DataEngine;
    hud: ScoreHUD;
    overlayContainer: HTMLElement;
    appContent: HTMLElement;
}

let context: LockerRoomContext | null = null;

export function setupLockerRoom(ctx: LockerRoomContext) {
    context = ctx;
}

export function showLockerRoom(_activeTab: 'loadout' | 'shop' | 'tourmap' = 'loadout') {
    if (!context) {
        console.error('LockerRoomOverlay context not initialized');
        return;
    }
    const { dataEngine, hud, overlayContainer, appContent } = context;
    const state = dataEngine.getState();

    stopTutorialTypewriter();
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
        club:         { icon: '💀', label: 'SPECIAL CLUB',   cls: 'club'    },
        sleeve:       { icon: '🔮', label: 'SPECIAL BALL',   cls: 'sleeve'  },
        mulligan:     { icon: '👻', label: 'MULLIGAN',        cls: 'consume' },
        stroke_boost: { icon: '⚡', label: 'EXTRA STROKE',   cls: 'consume' },
        cash_boost:   { icon: '💰', label: 'GOLD BOOST',     cls: 'gold'    },
        gamble:       { icon: '🎲', label: 'COIN WAGER',     cls: 'gamble'  },
    };

    const shopHTML = hasShopDraft ? `
        <div class="lr-shop ${state.shopCollapsed ? 'lr-shop--collapsed' : ''}">
            <div class="lr-shop-hdr">
                <div class="lr-shop-hdr-left">
                    <span class="lr-shop-hdr-title">👻 CURSED RELICS</span>
                    <span class="lr-shop-hdr-sub">Spend wisely — the Bogeyman is watching</span>
                </div>
                ${gambleResult !== null && !state.shopCollapsed ? `
                    <div class="lr-gamble-result ${gambleResult.won ? 'lr-gamble-result--win' : 'lr-gamble-result--lose'}">
                        ${gambleResult.won ? `🎰 WON $${gambleResult.amount}!` : '💀 LOST THE WAGER'}
                    </div>
                ` : ''}
                <div style="display: flex; gap: 0.4em; align-items: center;">
                    <button class="lr-reroll-btn" id="btn-shop-toggle">
                        ${state.shopCollapsed ? '▲ SHOW SHOP' : '▼ HIDE SHOP'}
                    </button>
                    ${!state.shopCollapsed ? `
                        <button class="lr-reroll-btn" id="btn-shop-reroll" ${!canReroll ? 'disabled' : ''}>
                            ${rerollLabel}
                        </button>
                    ` : ''}
                </div>
            </div>
            ${!state.shopCollapsed ? `
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
            ` : ''}
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
                            ${allClubs.map(club => `<div class="lr-club-item ${club.id === state.selectedClubId ? 'lr-club-item--active' : ''}" data-club-id="${club.id}"><div class="lr-club-meta"><span class="lr-club-name">${club.name.trim()}</span><span class="lr-club-type">${club.clubType}</span></div><div class="lr-club-desc">${club.description.trim()}</div><div class="lr-club-power">${club.powerScalar.toFixed(1)}x</div></div>`).join('')}
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

    // ── Wire shop toggle button ──
    document.getElementById('btn-shop-toggle')?.addEventListener('click', () => {
        state.shopCollapsed = !state.shopCollapsed;
        audio.playTick();
        showLockerRoom();
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
