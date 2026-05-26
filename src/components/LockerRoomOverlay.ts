import { audio } from '../engine/AudioSynthesizer';
import { DRAFTABLE_SLEEVES } from '../config/items';

import { stopTutorialTypewriter } from './HowToPlay';
import type { DataEngine } from '../engine/DataEngine';
import type { ScoreHUD } from './ScoreHUD';

interface LockerRoomContext {
    dataEngine: DataEngine;
    hud: ScoreHUD;
    overlayContainer: HTMLElement;
    appContent: HTMLElement;
    showTitleScreen?: () => void;
    showTournamentSelect?: () => void;
}

let context: LockerRoomContext | null = null;
let currentClubIndex = 0;
let currentSleeveIndex = 0;

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

    const hasShopDraft = state.shopDraft.length > 0;
    const allClubs = [...state.activeBag].sort((a, b) => b.powerScalar - a.powerScalar);
    const allSleeves = DRAFTABLE_SLEEVES.filter(s => state.inventorySleeves.includes(s.id));

    // Ensure carousel indices are valid
    if (currentClubIndex >= allClubs.length) currentClubIndex = 0;
    if (currentSleeveIndex >= allSleeves.length) currentSleeveIndex = 0;

    const currentClub = allClubs[currentClubIndex];
    const currentSleeve = allSleeves[currentSleeveIndex];



    // ── Build Shop Panel ──
    const gambleResult = state.lastGambleResult;
    state.lastGambleResult = null; // clear after reading so it doesn't persist

    const canReroll = state.shopRerollsLeft > 0 || state.money >= 25;
    const rerollLabel = state.shopRerollsLeft > 0
        ? `🎲 REROLL (${state.shopRerollsLeft} FREE)`
        : `🎲 REROLL ($25)`;

    const TYPE_META: Record<string, { icon: string; label: string; cls: string }> = {
        club: { icon: '💀', label: 'SPECIAL CLUB', cls: 'club' },
        sleeve: { icon: '🔮', label: 'SPECIAL BALL', cls: 'sleeve' },
        mulligan: { icon: '👻', label: 'MULLIGAN', cls: 'consume' },
        stroke_boost: { icon: '⚡', label: 'EXTRA STROKE', cls: 'consume' },
        cash_boost: { icon: '💰', label: 'GOLD BOOST', cls: 'gold' },
        gamble: { icon: '🎲', label: 'COIN WAGER', cls: 'gamble' },
        block: { icon: '🧱', label: 'BLOCK', cls: 'block' },
    };

    const shopHTML = hasShopDraft ? `
        <div class="lr-shop">
            <div class="lr-shop-hdr">
                <span class="lr-shop-hdr-title">SHOP: CURSED RELICS</span>
                ${gambleResult !== null ? `
                    <div class="lr-gamble-result ${gambleResult.won ? 'lr-gamble-result--win' : 'lr-gamble-result--lose'}">
                        ${gambleResult.won ? `🎰 WON $${gambleResult.amount}!` : '💀 LOST THE WAGER'}
                    </div>
                ` : ''}
            </div>
            <div class="lr-shop-list">
                ${state.shopDraft.map((item, idx) => {
        const isOwnedClub = item.type === 'club' && state.inventoryClubs.includes(item.id);
        const isOwnedSleeve = item.type === 'sleeve' && state.inventorySleeves.includes(item.id);
        const owned = isOwnedClub || isOwnedSleeve;
        const canAfford = state.money >= item.price;
        const buyable = !owned && canAfford;
        const meta = TYPE_META[item.type] ?? { icon: '?', label: item.type, cls: '' };

        let hint = '';
        if (item.type === 'cash_boost')
            hint = `Pay $${item.price} → Receive $${item.amount} <em>(+$${(item.amount ?? 0) - item.price} net)</em>`;
        else if (item.type === 'gamble')
            hint = `50%: WIN $${item.amount} | 50%: LOSE $${item.price}`;
        else if (item.type === 'mulligan' && (item.amount ?? 1) > 1)
            hint = `Grants +${item.amount} charges`;
        else if (item.type === 'stroke_boost' && (item.amount ?? 1) > 1)
            hint = `Grants +${item.amount} strokes`;

        const btnLabel = owned ? 'OWNED' : !canAfford ? 'NEED GOLD' : item.type === 'gamble' ? 'ROLL BONES' : `BUY ($${item.price})`;

        // If it's a gamble or buff, we make it full width, otherwise it could be a smaller card
        const isFullWidth = item.type === 'gamble' || item.type === 'cash_boost' || item.type === 'stroke_boost' || item.type === 'mulligan';

        return `
                        <div class="lr-shop-item ${isFullWidth ? 'lr-shop-item--full' : 'lr-shop-item--card'} ${owned ? 'lr-shop-item--owned' : ''} ${!canAfford && !owned ? 'lr-shop-item--broke' : ''}">
                            <div class="lr-shop-item-top">
                                <span class="lr-shop-item-icon">${meta.icon}</span>
                                <span class="lr-shop-item-name">${item.name}</span>
                            </div>
                            <div class="lr-shop-item-desc">${item.description}</div>
                            ${hint ? `<div class="lr-shop-item-hint">${hint}</div>` : ''}
                            <button class="lr-shop-card-btn" data-draft-idx="${idx}" ${buyable ? '' : 'disabled'}>
                                ${btnLabel}
                            </button>
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
                <div class="lr-header-left"></div>
                <img src="/Bogeyman%20The%20Golfing%20Roguelike.png" class="lr-logo" alt="Bogeyman Logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="lr-logo-text" style="display:none;">Bogeyman</div>
                <div class="lr-status-badge">
                    <div class="lr-status-title">GLOBAL STATUS</div>
                    <div class="lr-status-values">
                        <span class="lr-cash-value">SOUL GOLD: $${state.money}</span>
                        <span class="lr-survived-value">SURVIVED: ${state.tournamentResults.filter(r => r.passed).length}</span>
                    </div>
                </div>
            </div>

            <!-- Main 3-column body -->
            <div class="lr-body">
                <!-- Left Column: Equipment -->
                <div class="lr-col lr-col--equip">
                    <div class="lr-col-title">YOUR EQUIPMENT (BAG & BALLS)</div>
                    
                    <div class="lr-carousel-box">
                        <div class="lr-carousel-hdr">HAUNTED LOCKER: CLUB BAG CAROUSEL</div>
                        <div class="lr-carousel-body">
                            <button class="lr-carousel-btn" id="btn-club-prev">&lt;</button>
                            <div class="lr-carousel-content">
                                <div class="lr-carousel-icon">💀</div>
                                <div class="lr-carousel-name">${currentClub?.name || 'Empty'}</div>
                                <div class="lr-carousel-desc">${currentClub?.description || ''}</div>
                                <div class="lr-carousel-stats">${currentClub ? `${currentClub.powerScalar.toFixed(1)}x Power` : ''}</div>
                                ${currentClub?.id === state.selectedClubId ? `<div class="lr-carousel-badge">EQUIPPED</div>` : `<button class="lr-equip-btn" data-equip-type="club" data-equip-id="${currentClub?.id}">EQUIP</button>`}
                            </div>
                            <button class="lr-carousel-btn" id="btn-club-next">&gt;</button>
                        </div>
                        <div class="lr-carousel-footer">[${currentClubIndex + 1}/${allClubs.length} CLUBS]</div>
                    </div>

                    <div class="lr-carousel-box">
                        <div class="lr-carousel-hdr">HAUNTED LOCKER: BALL SLEEVE CAROUSEL</div>
                        <div class="lr-carousel-body">
                            <button class="lr-carousel-btn" id="btn-sleeve-prev">&lt;</button>
                            <div class="lr-carousel-content">
                                <div class="lr-carousel-icon">🔮</div>
                                <div class="lr-carousel-name">${currentSleeve?.name || 'Empty'}</div>
                                <div class="lr-carousel-stats">${currentSleeve ? `Elasticity: ${currentSleeve.elasticity.toFixed(2)}` : ''}</div>
                                ${currentSleeve?.id === state.activeSleeve.id ? `<div class="lr-carousel-badge">EQUIPPED</div>` : `<button class="lr-equip-btn" data-equip-type="sleeve" data-equip-id="${currentSleeve?.id}">EQUIP</button>`}
                            </div>
                            <button class="lr-carousel-btn" id="btn-sleeve-next">&gt;</button>
                        </div>
                        <div class="lr-carousel-footer">[${currentSleeveIndex + 1}/${allSleeves.length} BALLS]</div>
                    </div>
                </div>

                <!-- Middle Column: Relics & Buffs -->
                <div class="lr-col lr-col--buffs">
                    <div class="lr-col-title">HAUNTED LOCKER: ACTIVE RELICS & BUFFS</div>
                    
                    <div class="lr-buff-section">
                        <div class="lr-buff-hdr">OWNED BLOCKS</div>
                        <div class="lr-buff-grid">
                            ${Object.entries(state.blockInventory).filter(([_, count]) => count > 0).map(([_, count]) => `
                                <div class="lr-buff-slot">
                                    <span class="lr-buff-slot-icon">🧱</span>
                                    <span class="lr-buff-slot-count">x${count}</span>
                                </div>
                            `).join('') || '<div class="lr-buff-empty">No blocks owned</div>'}
                        </div>
                    </div>

                    <div class="lr-buff-section">
                        <div class="lr-buff-hdr">PASSIVE BUFFS</div>
                        <div class="lr-buff-list">
                            <div class="lr-buff-row">
                                <span>WIND RESISTANCE:</span>
                                <span>${state.activeSleeve.windImmunity ? 'IMMUNE' : '+0%'}</span>
                            </div>
                            <div class="lr-buff-row">
                                <span>RE-ROLLS PER RUN:</span>
                                <span>${state.shopRerollsLeft}</span>
                            </div>
                        </div>
                    </div>

                    <div class="lr-buff-section">
                        <div class="lr-buff-hdr">MULLIGAN CHARGES</div>
                        <div class="lr-buff-charges">${state.mulligansLeft}</div>
                    </div>
                </div>

                <!-- Right Column: Shop -->
                <div class="lr-col lr-col--shop">
                    ${shopHTML}
                </div>
            </div>

            <!-- Absolute Buttons -->
            <button id="btn-quit-run" class="screen-btn lr-abs-btn lr-btn-bl">QUIT RUN</button>
            <button id="btn-tee-off" class="screen-btn lr-abs-btn lr-btn-bc">GO TO TOUR</button>
            <button id="btn-shop-reroll" class="screen-btn lr-abs-btn lr-btn-br" ${!canReroll || !hasShopDraft ? 'disabled' : ''}>
                SHOP ACTIONS<br/>${rerollLabel}
            </button>
        </div>
    `;

    // ── Wire carousels ──
    document.getElementById('btn-club-prev')?.addEventListener('click', () => {
        currentClubIndex = (currentClubIndex - 1 + allClubs.length) % allClubs.length;
        audio.playTick();
        showLockerRoom();
    });
    document.getElementById('btn-club-next')?.addEventListener('click', () => {
        currentClubIndex = (currentClubIndex + 1) % allClubs.length;
        audio.playTick();
        showLockerRoom();
    });
    document.getElementById('btn-sleeve-prev')?.addEventListener('click', () => {
        currentSleeveIndex = (currentSleeveIndex - 1 + allSleeves.length) % allSleeves.length;
        audio.playTick();
        showLockerRoom();
    });
    document.getElementById('btn-sleeve-next')?.addEventListener('click', () => {
        currentSleeveIndex = (currentSleeveIndex + 1) % allSleeves.length;
        audio.playTick();
        showLockerRoom();
    });

    // ── Wire equip buttons ──
    overlayContainer.querySelectorAll('.lr-equip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-equip-type');
            const id = btn.getAttribute('data-equip-id');
            if (type === 'club' && id) {
                dataEngine.selectClub(id);
            } else if (type === 'sleeve' && id) {
                dataEngine.equipSleeve(id);
            }
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
        audio.playGate();
        context?.showTournamentSelect?.();
    });

    // ── Wire Quit Run button ──
    document.getElementById('btn-quit-run')?.addEventListener('click', () => {
        audio.playTick();
        dataEngine.resetGame();
        overlayContainer.style.display = 'none';
        appContent.style.opacity = '1.0';
        hud.update(dataEngine.getState());
        context?.showTitleScreen?.();
    });
}
