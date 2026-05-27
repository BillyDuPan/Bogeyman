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



    let buff_base_yardage = 0;
    let buff_wall_bounce_mult = 0;
    let buff_sand_rough_forgiveness = 0;
    let buff_passive_cash = 0;
    let buff_projection_ray = 0;

    state.passiveBuffs.forEach(buff => {
        if (buff.id === 'buff_base_yardage') buff_base_yardage += buff.baseYardsBonus || 0;
        if (buff.id === 'buff_wall_bounce_mult') buff_wall_bounce_mult += buff.wallBounceMultiplierBonus || 0;
        if (buff.id === 'buff_sand_rough_forgiveness') buff_sand_rough_forgiveness += buff.sandRoughPenaltyReduction || 0;
        if (buff.id === 'buff_passive_cash') buff_passive_cash += buff.cashPerHole || 0;
        if (buff.id === 'buff_projection_ray') buff_projection_ray += buff.projectionRayLengthBonus || 0;
    });

    const statRow = (label: string, baseStr: string, buffStr: string, isBuffed: boolean) => `
        <div style="display:flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color:var(--color-base);">${label}</span>
            <span>${baseStr} <span style="color: ${isBuffed ? 'var(--color-gold)' : '#555'}">${buffStr}</span></span>
        </div>
    `;

    // ── Build Shop Panel ──
    const gambleResult = state.lastGambleResult;
    state.lastGambleResult = null; // clear after reading so it doesn't persist

    const canReroll = state.money >= state.currentRerollCost;

    const TYPE_META: Record<string, { icon: string; label: string; cls: string }> = {
        club: { icon: '💀', label: 'SPECIAL CLUB', cls: 'club' },
        sleeve: { icon: '🔮', label: 'SPECIAL BALL', cls: 'sleeve' },
        mulligan: { icon: '👻', label: 'MULLIGAN', cls: 'consume' },
        stroke_boost: { icon: '⚡', label: 'EXTRA STROKE', cls: 'consume' },
        cash_boost: { icon: '💰', label: 'GOLD BOOST', cls: 'gold' },
        gamble: { icon: '🎲', label: 'COIN WAGER', cls: 'gamble' },
        block: { icon: '🧱', label: 'BLOCK', cls: 'block' },
        passive: { icon: '📦', label: 'MYSTERY BOX', cls: 'passive' }
    };

    const renderItem = (item: any, idx: number) => {
        const isOwnedClub = item.type === 'club' && state.inventoryClubs.includes(item.id);
        const isOwnedSleeve = item.type === 'sleeve' && state.inventorySleeves.includes(item.id);
        const owned = isOwnedClub || isOwnedSleeve;
        const canAfford = state.money >= item.price;
        const buyable = !owned && canAfford;
        const meta = TYPE_META[item.type] ?? { icon: '?', label: item.type, cls: '' };

        let hint = '';
        if (item.type === 'cash_boost') hint = `Pay $${item.price} → Receive $${item.amount}`;
        else if (item.type === 'gamble') hint = `50%: WIN $${item.amount} | 50%: LOSE $${item.price}`;
        else if (item.type === 'mulligan' && (item.amount ?? 1) > 1) hint = `Grants +${item.amount} charges`;
        else if (item.type === 'stroke_boost' && (item.amount ?? 1) > 1) hint = `Grants +${item.amount} strokes`;

        const btnLabel = owned ? 'OWNED' : !canAfford ? 'NEED GOLD' : item.type === 'gamble' ? 'ROLL BONES' : `BUY ($${item.price})`;
        const rarityClass = item.rarity ? `lr-shop-item-rarity--${item.rarity.toLowerCase()}` : '';

        return `
            <div class="lr-shop-item lr-shop-item--card ${owned ? 'lr-shop-item--owned' : ''} ${!canAfford && !owned ? 'lr-shop-item--broke' : ''} ${rarityClass}">
                <div class="lr-shop-item-top">
                    <img src="/images/shop/item_${item.type}.png" class="lr-shop-item-img" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" />
                    <span class="lr-shop-item-icon" style="display:none;">${meta.icon}</span>
                    <span class="lr-shop-item-name">${item.name}</span>
                </div>
                <div class="lr-shop-item-desc">${item.description}</div>
                ${hint ? `<div class="lr-shop-item-hint">${hint}</div>` : ''}
                <button class="lr-shop-card-btn" data-draft-idx="${idx}" data-item-type="${item.type}" ${buyable ? '' : 'disabled'}>
                    ${btnLabel}
                </button>
            </div>
        `;
    };

    const blockItems = state.shopDraft.map((item, idx) => ({item, idx})).filter(x => x.item.type === 'block');
    const equipItems = state.shopDraft.map((item, idx) => ({item, idx})).filter(x => x.item.type === 'club' || x.item.type === 'sleeve');
    const specialItems = state.shopDraft.map((item, idx) => ({item, idx})).filter(x => x.item.type !== 'block' && x.item.type !== 'club' && x.item.type !== 'sleeve');

    const shopHTML = hasShopDraft ? `
        <div class="lr-col-title">SHOP: CURSED RELICS</div>
        ${gambleResult !== null ? `
            <div class="lr-gamble-result ${gambleResult.won ? 'lr-gamble-result--win' : 'lr-gamble-result--lose'}" style="margin-bottom: 10px;">
                ${gambleResult.won ? `🎰 WON $${gambleResult.amount}!` : '💀 LOST THE WAGER'}
            </div>
        ` : ''}

        <div class="lr-carousel-box" style="margin-bottom: 15px;">
            <div class="lr-carousel-hdr">EQUIPMENT & BLOCKS</div>
            <div class="lr-carousel-body" style="padding: 10px; display: flex; gap: 15px;">
                <div style="flex: 1; display: flex; flex-direction: column; border-right: 2px dashed #444; padding-right: 15px;">
                    <div style="font-size: 0.7em; color: var(--color-base); margin-bottom: 6px; font-family: var(--font-arcade); text-align: center;">BLOCK SHOP</div>
                    <div style="flex: 1; display: flex;">
                        ${blockItems.length > 0 ? blockItems.map(x => renderItem(x.item, x.idx)).join('') : '<div style="margin: auto; color: #555; font-size: 0.8em;">SOLD OUT</div>'}
                    </div>
                </div>

                <div style="flex: 2; display: flex; flex-direction: column;">
                    <div style="font-size: 0.7em; color: var(--color-gold); margin-bottom: 6px; font-family: var(--font-arcade); display: flex; justify-content: space-between; align-items: center;">
                        <span>EQUIPMENT DRAFT</span>
                        <button id="btn-shop-reroll-inner" class="screen-btn" style="font-size: 0.85em; padding: 2px 6px; min-height: 24px;" ${!canReroll ? 'disabled' : ''}>
                           REROLL DRAFT ($${state.currentRerollCost})
                        </button>
                    </div>
                    <div style="flex: 1; display: flex; gap: 8px;">
                        ${equipItems.length > 0 ? equipItems.map(x => renderItem(x.item, x.idx)).join('') : ''}
                    </div>
                </div>
            </div>
        </div>

        <div class="lr-carousel-box" style="flex: 1; display: flex; flex-direction: column;">
            <div class="lr-carousel-hdr">CASINO & CURSES</div>
            <div class="lr-carousel-body" style="padding: 10px; flex: 1; overflow-y: auto;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${specialItems.length > 0 ? specialItems.map(x => renderItem(x.item, x.idx)).join('') : '<div style="grid-column: 1 / -1; text-align: center; color: #555; font-size: 0.8em; padding: 10px;">SOLD OUT</div>'}
                </div>
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

                    <div class="lr-buff-section" style="flex: 1; display: flex; flex-direction: column;">
                        <div class="lr-buff-hdr">PLAYER STATS</div>
                        <div class="lr-buff-list" style="font-family: var(--font-arcade); font-size: 0.8em; line-height: 1.4; padding: 10px;">
                            ${statRow('Mulligans:', String(state.mulligansLeft), '', false)}
                            ${statRow('Club Power:', currentClub ? currentClub.powerScalar.toFixed(1) + 'x' : '1.0x', '', currentClub?.powerScalar !== 1)}
                            ${statRow('Ball Bounce:', currentSleeve ? currentSleeve.elasticity.toFixed(2) : '0.85', '', currentSleeve?.elasticity !== 0.85)}
                            ${statRow('Wind Resist:', currentSleeve?.windImmunity ? 'YES' : 'NO', '', currentSleeve?.windImmunity || false)}
                            ${statRow('Base Yardage:', '250', '(+' + buff_base_yardage + ')', buff_base_yardage > 0)}
                            ${statRow('Wall Bounce:', '+0.5x', '(+' + buff_wall_bounce_mult.toFixed(1) + ')', buff_wall_bounce_mult > 0)}
                            ${statRow('Lie Forgiven:', '0.0x', '(+' + buff_sand_rough_forgiveness.toFixed(1) + ')', buff_sand_rough_forgiveness > 0)}
                            ${statRow('Passive Cash:', '$0', '(+$' + buff_passive_cash + ')', buff_passive_cash > 0)}
                            ${statRow('Aim Ray Lens:', '1.0x', '(+' + buff_projection_ray.toFixed(1) + ')', buff_projection_ray > 0)}
                        </div>
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
            const type = btn.getAttribute('data-item-type') || '';
            if (idx >= 0) {
                const prevPassivesCount = state.passiveBuffs.length;
                const success = dataEngine.buyDraftItem(idx);
                if (success) {
                    audio.playGate();
                    hud.update(state);
                    
                    if (type === 'passive' && state.passiveBuffs.length > prevPassivesCount) {
                        const newBuff = state.passiveBuffs[state.passiveBuffs.length - 1];
                        showMysteryBoxUnboxing(newBuff, () => {
                            showLockerRoom();
                        });
                    } else if (type === 'gamble' && state.lastGambleResult !== null) {
                        const gamble = state.lastGambleResult;
                        showCoinToss(gamble.won, gamble.amount, () => {
                            showLockerRoom();
                        });
                    } else {
                        showLockerRoom();
                    }
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

function showMysteryBoxUnboxing(buff: any, onComplete: () => void) {
    if (!context) return;
    
    const popup = document.createElement('div');
    popup.className = 'unboxing-overlay overlay-fullvp';
    popup.innerHTML = `
        <div class="unboxing-container">
            <h2 class="unboxing-title">MYSTERY BOX OPENED!</h2>
            <div class="unboxing-card-flip">
                <div class="unboxing-card-inner">
                    <div class="unboxing-card-front">?</div>
                    <div class="unboxing-card-back lr-shop-item-rarity--${buff.rarity.toLowerCase()}">
                        <img src="/images/shop/item_passive.png" class="lr-shop-item-img" alt="${buff.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                        <div class="lr-shop-item-icon" style="display:none;">🌟</div>
                        <div class="lr-shop-item-name">${buff.name}</div>
                        <div class="lr-shop-item-desc" style="color:white;">${buff.description}</div>
                        <div class="lr-shop-item-hint">${buff.rarity} Passive</div>
                    </div>
                </div>
            </div>
            <button class="screen-btn" id="btn-close-unboxing" style="display:none; margin-top:2em;">AWESOME!</button>
        </div>
    `;
    context.overlayContainer.appendChild(popup);
    
    // Trigger animation
    setTimeout(() => {
        popup.querySelector('.unboxing-card-inner')?.classList.add('flipped');
        audio.playBumper();
        setTimeout(() => {
            const btn = document.getElementById('btn-close-unboxing');
            if (btn) btn.style.display = 'block';
        }, 1000);
    }, 800);

    document.getElementById('btn-close-unboxing')?.addEventListener('click', () => {
        audio.playTick();
        popup.remove();
        onComplete();
    });
}

function showCoinToss(won: boolean, amount: number, onComplete: () => void) {
    if (!context) return;
    
    const popup = document.createElement('div');
    popup.className = 'unboxing-overlay overlay-fullvp';
    popup.innerHTML = `
        <style>
        .coin-toss-flip {
            width: 150px; height: 150px; margin: 0 auto; perspective: 1000px;
        }
        .coin-inner {
            width: 100%; height: 100%; transition: transform 2s cubic-bezier(0.2, 0.8, 0.2, 1); transform-style: preserve-3d; position: relative;
        }
        .coin-inner.flipped-win { transform: rotateY(1800deg); }
        .coin-inner.flipped-lose { transform: rotateY(1980deg); }
        .coin-face {
            width: 100%; height: 100%; position: absolute; backface-visibility: hidden; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: var(--font-arcade); font-size: 1.5em; border: 6px solid #fff;
        }
        .coin-front { background: gold; color: #000; border-color: #b8860b; box-shadow: inset 0 0 20px #b8860b; }
        .coin-back { background: #333; color: #fff; transform: rotateY(180deg); border-color: #111; box-shadow: inset 0 0 20px #111; }
        </style>
        <div class="unboxing-container">
            <h2 class="unboxing-title">TOSSING THE COIN...</h2>
            <div class="coin-toss-flip">
                <div class="coin-inner">
                    <div class="coin-face coin-front">
                        <div>WIN</div>
                        <div style="font-size:0.6em;">+$${amount}</div>
                    </div>
                    <div class="coin-face coin-back">
                        <div style="font-size:2em;">💀</div>
                    </div>
                </div>
            </div>
            <button class="screen-btn" id="btn-close-coin" style="display:none; margin-top:2em;">CONTINUE</button>
        </div>
    `;
    context.overlayContainer.appendChild(popup);
    
    setTimeout(() => {
        popup.querySelector('.coin-inner')?.classList.add(won ? 'flipped-win' : 'flipped-lose');
        audio.playBumper();
        setTimeout(() => {
            const title = popup.querySelector('.unboxing-title');
            if (title) title.textContent = won ? '🎰 YOU WON!' : '💀 YOU LOST!';
            const btn = document.getElementById('btn-close-coin');
            if (btn) btn.style.display = 'block';
        }, 2200);
    }, 100);

    document.getElementById('btn-close-coin')?.addEventListener('click', () => {
        audio.playTick();
        popup.remove();
        onComplete();
    });
}
