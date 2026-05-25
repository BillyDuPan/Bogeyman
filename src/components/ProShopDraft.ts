import type { GameState, ClubModifier, SleeveModifier } from '../types/game';
import { DRAFTABLE_CLUBS, DRAFTABLE_SLEEVES } from '../config/items';
import { TOURNAMENT_DATA } from '../config/terrain';

export class ProShopDraft {
    private container: HTMLElement | null = null;
    private onAdvance: (() => void) | null = null;
    private onBuyClub: ((club: ClubModifier) => boolean) | null = null;
    private onBuySleeve: ((sleeve: SleeveModifier) => boolean) | null = null;
    private onBuyConsumable: ((type: 'mulligan' | 'stroke_boost', cost: number) => boolean) | null = null;

    // Generated shop items for the current session
    private currentShopItems: {
        id: string;
        name: string;
        description: string;
        price: number;
        type: 'club' | 'sleeve' | 'mulligan' | 'stroke_boost';
        ref: any;
    }[] = [];

    initialize(
        container: HTMLElement,
        handlers: {
            onAdvance: () => void;
            onBuyClub: (club: ClubModifier) => boolean;
            onBuySleeve: (sleeve: SleeveModifier) => boolean;
            onBuyConsumable: (type: 'mulligan' | 'stroke_boost', cost: number) => boolean;
        }
    ) {
        this.container = container;
        this.onAdvance = handlers.onAdvance;
        this.onBuyClub = handlers.onBuyClub;
        this.onBuySleeve = handlers.onBuySleeve;
        this.onBuyConsumable = handlers.onBuyConsumable;
    }

    generateShopItems(state: GameState) {
        this.currentShopItems = [];

        // 1. Filter unowned clubs
        const availableClubs = DRAFTABLE_CLUBS.filter(
            c => !state.inventoryClubs.includes(c.id)
        );
        // Shuffle and select up to 2
        const selectedClubs = [...availableClubs].sort(() => 0.5 - Math.random()).slice(0, 2);
        selectedClubs.forEach(club => {
            this.currentShopItems.push({
                id: club.id,
                name: club.name,
                description: club.description,
                price: club.cost,
                type: 'club',
                ref: club
            });
        });

        // 2. Filter unowned sleeves
        const availableSleeves = DRAFTABLE_SLEEVES.filter(
            s => !state.inventorySleeves.includes(s.id)
        );
        const selectedSleeves = [...availableSleeves].sort(() => 0.5 - Math.random()).slice(0, 1);
        selectedSleeves.forEach(sleeve => {
            this.currentShopItems.push({
                id: sleeve.id,
                name: sleeve.name,
                description: sleeve.description,
                price: sleeve.cost,
                type: 'sleeve',
                ref: sleeve
            });
        });

        // 3. Add Mulligan recharge pack
        this.currentShopItems.push({
            id: 'refill_mulligan',
            name: 'Mulligan Charge (+1)',
            description: 'Rewind time to retry a shot. +1 Mulligan charge.',
            price: 35,
            type: 'mulligan',
            ref: null
        });

        // 4. Fill remaining spots with stroke boosts if list is short
        if (this.currentShopItems.length < 4) {
            this.currentShopItems.push({
                id: 'extra_stroke',
                name: 'Extra Stroke (+1)',
                description: 'Increase shot limit. +1 stroke allowed next tournament.',
                price: 60,
                type: 'stroke_boost',
                ref: null
            });
        }

        // Limit exactly to 4 items
        this.currentShopItems = this.currentShopItems.slice(0, 4);
    }

    render(state: GameState) {
        if (!this.container) return;

        const tournament = TOURNAMENT_DATA[state.currentTournamentIndex];
        const cumulativeScore = state.cumulativeTournamentPoints;
        const targetCut = tournament.cutTarget;
        const passedCut = cumulativeScore >= targetCut;

        // Populate shop options if this is the first time we load the shop for this round
        if (this.currentShopItems.length === 0 && passedCut) {
            this.generateShopItems(state);
        }

        // Renders visual overlays
        if (!passedCut) {
            // MISSED THE CUT / GAMEOVER
            this.container.innerHTML = `
                <div class="screen-overlay">
                    <div class="arcade-title" style="font-size: 1.2em; color: var(--color-danger); text-shadow: 0 0 10px rgba(255, 118, 117, 0.5); margin-bottom: 0.4em;">
                        MISSED CUT
                    </div>
                    <div class="arcade-subtitle" style="color: var(--color-danger); margin-bottom: 1.2em; font-size: 0.6em;">
                        Season Terminated
                    </div>
                    
                    <div class="hud-block" style="width: 100%; max-width: 400px; margin-bottom: 1.5em; font-size: 0.55em;">
                        <h3 class="hud-title" style="margin-bottom: 10px; color: #ffffff; text-align: center;">Tournament Recap</h3>
                        <div class="hud-score-row" style="margin-bottom: 8px;">
                            <span>Tournament:</span>
                            <span>${tournament.name}</span>
                        </div>
                        <div class="hud-score-row" style="margin-bottom: 8px;">
                            <span>Your Total Score:</span>
                            <span style="color: var(--color-danger); font-family: var(--font-arcade);">${cumulativeScore.toLocaleString()}</span>
                        </div>
                        <div class="hud-score-row">
                            <span>Cut Line Target:</span>
                            <span style="color: var(--color-gold); font-family: var(--font-arcade);">${targetCut.toLocaleString()}</span>
                        </div>
                    </div>

                    <button id="btn-restart" class="screen-btn" style="background: linear-gradient(135deg, var(--color-danger), #b71540); box-shadow: 0 4px 15px rgba(255, 118, 117, 0.4);">
                        TRY AGAIN
                    </button>
                </div>
            `;

            document.getElementById('btn-restart')?.addEventListener('click', () => {
                location.reload();
            });
        } else {
            // PASSED CUT / SHOP DRAFT OVERLAY
            const rewardCash = tournament.rewardCash;
            const nextIndex = state.currentTournamentIndex + 1;
            const hasNextTournament = nextIndex < TOURNAMENT_DATA.length;

            const titleText = hasNextTournament ? 'PRO SHOP & GEAR DRAFT' : 'SEASON CHAMPION!';
            const subtitleText = hasNextTournament ? 'Draft Gear for the Next Round' : 'Congratulations!';

            this.container.innerHTML = `
                <div class="screen-overlay">
                    <h2>${titleText}</h2>
                    <div class="arcade-subtitle" style="font-size: 0.55em; margin-bottom: 1.2em;">${subtitleText}</div>

                    <!-- Placement Recap -->
                    <div class="hud-block" style="width: 100%; max-width: 440px; margin-bottom: 1em; font-size: 0.55em;">
                        <div class="hud-score-row" style="margin-bottom: 6px;">
                            <span>Tournament:</span>
                            <span>${tournament.name}</span>
                        </div>
                        <div class="hud-score-row" style="margin-bottom: 6px;">
                            <span>Final Score:</span>
                            <span style="color: var(--color-success); font-family: var(--font-arcade);">${cumulativeScore.toLocaleString()} pts</span>
                        </div>
                        <div class="hud-score-row" style="margin-bottom: 6px;">
                            <span>Cut Line Target:</span>
                            <span style="font-family: var(--font-arcade);">${targetCut.toLocaleString()} pts</span>
                        </div>
                        <div class="hud-score-row" style="color: var(--color-success); border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; margin-top: 6px;">
                            <span>Payout Earned:</span>
                            <span style="font-family: var(--font-arcade);">+$${rewardCash} Cash</span>
                        </div>
                    </div>

                    <div class="shop-cash-indicator">
                        Current Cash: $${state.money}
                    </div>

                    <!-- Items selection grid -->
                    ${hasNextTournament ? `
                        <div class="shop-grid">
                            ${this.currentShopItems.map((item, idx) => {
                                const isOwnedClub = item.type === 'club' && state.inventoryClubs.includes(item.id);
                                const isOwnedSleeve = item.type === 'sleeve' && state.inventorySleeves.includes(item.id);
                                const canAfford = state.money >= item.price;
                                const buyable = !isOwnedClub && !isOwnedSleeve && canAfford;

                                let btnLabel = 'Buy';
                                if (isOwnedClub || isOwnedSleeve) btnLabel = 'OWNED';
                                else if (!canAfford) btnLabel = 'NO CASH';

                                return `
                                    <div class="shop-item">
                                        <div class="shop-item-name">${item.name}</div>
                                        <div class="shop-item-desc">${item.description}</div>
                                        <div class="shop-item-price">$${item.price}</div>
                                        <button class="shop-item-btn" data-idx="${idx}" ${buyable ? '' : 'disabled'}>
                                            ${btnLabel}
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="hud-block" style="padding: 1.2em; margin-bottom: 1.5em; max-width: 440px; font-size: 0.55em; line-height: 1.6;">
                            <p style="font-size: 1.15em; color: var(--color-gold); margin-bottom: 8px;">
                                YOU HAVE COMPLETED THE GOLF SEASON!
                            </p>
                            <p style="font-size: 0.9em; opacity: 0.85; line-height: 1.5;">
                                You successfully passed all 8 cut lines, built an illegal bag of clubs, and claimed the Mulligan Mania Trophy! Play again to beat your high score.
                            </p>
                        </div>
                    `}

                    <button id="btn-next-round" class="screen-btn">
                        ${hasNextTournament ? 'PROCEED TO NEXT TOURNAMENT' : 'RESTART CAMPAIGN'}
                    </button>
                </div>
            `;

            // Wire up buy buttons
            const buyButtons = this.container.querySelectorAll('.shop-item-btn');
            buyButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.getAttribute('data-idx') || '-1');
                    if (idx !== -1) {
                        const item = this.currentShopItems[idx];
                        let success = false;
                        if (item.type === 'club') {
                            success = this.onBuyClub ? this.onBuyClub(item.ref) : false;
                        } else if (item.type === 'sleeve') {
                            success = this.onBuySleeve ? this.onBuySleeve(item.ref) : false;
                        } else if (item.type === 'mulligan') {
                            success = this.onBuyConsumable ? this.onBuyConsumable('mulligan', item.price) : false;
                        } else if (item.type === 'stroke_boost') {
                            success = this.onBuyConsumable ? this.onBuyConsumable('stroke_boost', item.price) : false;
                        }

                        if (success) {
                            // Rerender to show new cash and state
                            this.render(state);
                        }
                    }
                });
            });

            // Wire up proceed button
            document.getElementById('btn-next-round')?.addEventListener('click', () => {
                this.currentShopItems = []; // clear shop items for next draft session
                if (this.onAdvance) this.onAdvance();
            });
        }
    }
}
