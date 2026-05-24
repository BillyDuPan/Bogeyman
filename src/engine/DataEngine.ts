import type { GameState, ClubModifier, SleeveModifier, HoleScorecard, Vector2D, ShopDraftItem, TournamentResult } from '../types/game';
import { TOURNAMENT_DATA } from '../config/terrain';
import { audio } from './AudioSynthesizer';

// Base Starting Clubs (Cursed hand-me-downs from fallen golfers)
export const DEFAULT_CLUBS: ClubModifier[] = [
    {
        id: 'std_driver',
        name: 'Rattled 1-Wood',
        description: 'Rattled from a forgotten attic. 2.0x Power.',
        clubType: 'Driver',
        powerScalar: 2.0,
        cost: 0
    },
    {
        id: 'std_5iron',
        name: 'Haunted Long-Iron',
        description: 'Hums on the backswing. 1.3x Power.',
        clubType: 'Iron',
        powerScalar: 1.3,
        cost: 0
    },
    {
        id: 'std_9iron',
        name: 'Banshee 9-Iron',
        description: 'Screams at impact. 1.1x Power.',
        clubType: 'Iron',
        powerScalar: 1.1,
        cost: 0
    },
    {
        id: 'std_wedge',
        name: 'Crypt Wedge',
        description: 'Chipped from old gravestones. 1.0x Power.',
        clubType: 'Wedge',
        powerScalar: 1.0,
        cost: 0
    },
    {
        id: 'std_putter',
        name: 'Grave Roller',
        description: 'Glides over haunted greens. 0.8x Power. (Green Only)',
        clubType: 'Putter',
        powerScalar: 0.8,
        cost: 0
    }
];

// Cursed Relic Clubs (unearthed from the Bogeyman's course)
export const DRAFTABLE_CLUBS: ClubModifier[] = [
    {
        id: 'illegal_1iron',
        name: 'Cursed 1-Iron',
        description: 'Cursed for raw power: 2.5x! Wall bounces drain the curse — resets mult to 1.0x.',
        clubType: 'Iron',
        powerScalar: 2.5,
        cost: 120
    },
    {
        id: 'sand_wedge_60',
        name: 'Ectoplasm Wedge',
        description: 'Ecto-coated face. Bunker ecto counts as 5.0x lie (vs. 0.3x).',
        clubType: 'Wedge',
        powerScalar: 0.9,
        cost: 85
    },
    {
        id: 'beryllium_putter',
        name: 'Skull-Cage Putter',
        description: 'Green only. Skull bounces add +100 yards base.',
        clubType: 'Putter',
        powerScalar: 0.8,
        cost: 100
    },
    {
        id: 'titanium_driver',
        name: "Reaper's Driver",
        description: "The Reaper's reach: 2.3x Power. +100 yards on the Tee Box.",
        clubType: 'Driver',
        powerScalar: 2.3,
        cost: 130
    },
    {
        id: 'golden_putter',
        name: 'Gilded Skull Putter',
        description: "Green only. Doubles this shot's final curse score.",
        clubType: 'Putter',
        powerScalar: 0.7,
        cost: 140
    },
    {
        id: 'heavy_hybrid',
        name: 'Gravedigger Hybrid',
        description: '1.5x Power. Cuts through rough like fresh earth. Rough lie = 1.0x.',
        clubType: 'Iron',
        powerScalar: 1.5,
        cost: 110
    },
    {
        id: 'trick_wedge',
        name: 'Hex Wedge',
        description: '1.0x Power. Each wall bounce casts +1.0x (vs. +0.5x).',
        clubType: 'Wedge',
        powerScalar: 1.0,
        cost: 95
    }
];

// Consumable & special items available in the shop pool
const SHOP_CONSUMABLE_POOL: Array<Omit<ShopDraftItem, 'ref'>> = [
    {
        id: 'refill_mulligan',
        name: 'Soul Rewind',
        description: 'Reclaim one cursed shot from the void. +1 Spirit Charge.',
        price: 35,
        type: 'mulligan',
        amount: 1
    },
    {
        id: 'ectoplasm_flask',
        name: 'Ectoplasm Flask',
        description: 'Double your safety net. +2 Spirit Charges for the next round.',
        price: 70,
        type: 'mulligan',
        amount: 2
    },
    {
        id: 'extra_stroke',
        name: 'Phantom Stroke',
        description: 'Conjure one extra stroke from thin air for the next haunt.',
        price: 60,
        type: 'stroke_boost',
        amount: 1
    },
    {
        id: 'bone_cache',
        name: 'Bone Cache',
        description: 'Unearth 3 extra strokes pre-loaded across the next tournament.',
        price: 115,
        type: 'stroke_boost',
        amount: 3
    },
    {
        id: 'soul_vault',
        name: 'Soul Vault',
        description: 'Convert $40 of cursed gold into $100. Guaranteed net +$60.',
        price: 40,
        type: 'cash_boost',
        amount: 100
    },
    {
        id: 'reapers_wager',
        name: "Reaper's Wager",
        description: 'Pay $20. The Reaper flips: 50% → collect $200. 50% → the Reaper keeps it.',
        price: 20,
        type: 'gamble',
        amount: 200
    },
];

// Spirit Ball Sleeves (vessels of supernatural energy)
export const DRAFTABLE_SLEEVES: SleeveModifier[] = [
    {
        id: 'std_sleeve',
        name: 'Hollow Dimple',
        description: 'Standard hollow-core spirit ball. 0.85 elasticity.',
        elasticity: 0.85,
        windImmunity: false,
        cost: 0
    },
    {
        id: 'balata_sleeve',
        name: 'Bound Wraith Balata',
        description: 'A bound spirit compressed inside. Elasticity 0.96.',
        elasticity: 0.96,
        windImmunity: false,
        cost: 110
    },
    {
        id: 'lowspin_sleeve',
        name: 'Phantom Shell',
        description: 'Passes through the wind unseen. Immune to wind drift.',
        elasticity: 0.85,
        windImmunity: true,
        cost: 100
    },
    {
        id: 'super_bouncer',
        name: 'Poltergeist Core',
        description: 'Chaotic bouncing spirit within. Elasticity 0.98.',
        elasticity: 0.98,
        windImmunity: false,
        cost: 140
    }
];

export class DataEngine {
    private state!: GameState;

    constructor() {
        this.state = this.buildInitialState();
    }

    private buildInitialState(): GameState {
        return {
            money: 0,
            currentTournamentIndex: 0,
            currentHoleIndex: 0,
            allowedStrokes: 3,
            mulligansLeft: 2,
            cumulativeTournamentPoints: 0,
            selectedClubId: 'std_driver',
            activeBag: [...DEFAULT_CLUBS],
            activeSleeve: DRAFTABLE_SLEEVES[0],
            inventoryClubs: DEFAULT_CLUBS.map(c => c.id),
            inventorySleeves: [DRAFTABLE_SLEEVES[0].id],
            scorecardList: [],
            ball: {
                pos: { x: 50, y: 100 },
                vel: { x: 0, y: 0 },
                radius: 4.5,
                isMoving: false,
                currentTileId: 0
            },
            strokeIndex: 1,
            currentFrame: null,
            gameMode: 'title',
            wind: { x: 0, y: 0 },
            mulliganHistory: [],
            sfxVolume: this.state?.sfxVolume ?? 0.5,
            musicVolume: this.state?.musicVolume ?? 0.5,
            selectedTrack: this.state?.selectedTrack ?? 'custom',
            shopDraft: [],
            tournamentResults: [],
            pendingExtraStrokes: 0,
            shopRerollsLeft: 2,
            lastGambleResult: null
        };
    }

    resetGame() {
        // Mutate the existing state object so any external references (e.g. main.ts `const state`) stay valid
        Object.assign(this.state, this.buildInitialState());
    }

    getState(): GameState {
        return this.state;
    }

    setGameMode(mode: GameState['gameMode']) {
        this.state.gameMode = mode;
    }

    selectClub(clubId: string) {
        const owned = this.state.inventoryClubs.includes(clubId);
        if (owned) {
            this.state.selectedClubId = clubId;
        }
    }

    /** Equip a sleeve from inventory (no purchase needed) */
    equipSleeve(sleeveId: string) {
        if (!this.state.inventorySleeves.includes(sleeveId)) return false;
        const sleeve = DRAFTABLE_SLEEVES.find(s => s.id === sleeveId);
        if (sleeve) {
            this.state.activeSleeve = sleeve;
            return true;
        }
        return false;
    }

    /**
     * Record the outcome of the current tournament into tournamentResults.
     * Should be called once the cut is evaluated.
     */
    saveTournamentResult(passed: boolean, cashEarned: number) {
        const tourney = TOURNAMENT_DATA[this.state.currentTournamentIndex];
        const result: TournamentResult = {
            tournamentIndex: this.state.currentTournamentIndex,
            name: tourney.name,
            score: this.state.cumulativeTournamentPoints,
            cutTarget: tourney.cutTarget,
            passed,
            cashEarned
        };
        // Replace existing result for this tournament index if present
        const existing = this.state.tournamentResults.findIndex(r => r.tournamentIndex === result.tournamentIndex);
        if (existing >= 0) {
            this.state.tournamentResults[existing] = result;
        } else {
            this.state.tournamentResults.push(result);
        }
    }

    /**
     * Generate a fresh shop draft. Called after a tournament cut or on reroll.
     * Pass isReroll=true to preserve the reroll counter.
     */
    generateShopDraft(isReroll = false) {
        if (!isReroll) {
            this.state.shopRerollsLeft = 2;
        }
        this.state.lastGambleResult = null;

        const items: ShopDraftItem[] = [];

        // Up to 2 random unowned clubs
        const availableClubs = DRAFTABLE_CLUBS.filter(c => !this.state.inventoryClubs.includes(c.id));
        [...availableClubs].sort(() => 0.5 - Math.random()).slice(0, 2).forEach(club => {
            items.push({ id: club.id, name: club.name, description: club.description, price: club.cost, type: 'club', ref: club });
        });

        // Up to 1 random unowned sleeve
        const availableSleeves = DRAFTABLE_SLEEVES.filter(s => !this.state.inventorySleeves.includes(s.id));
        [...availableSleeves].sort(() => 0.5 - Math.random()).slice(0, 1).forEach(sleeve => {
            items.push({ id: sleeve.id, name: sleeve.name, description: sleeve.description, price: sleeve.cost, type: 'sleeve', ref: sleeve });
        });

        // 3 random consumables from pool
        [...SHOP_CONSUMABLE_POOL].sort(() => 0.5 - Math.random()).slice(0, 3).forEach(cons => {
            items.push({ ...cons, ref: null });
        });

        this.state.shopDraft = items.slice(0, 6);
    }

    /**
     * Reroll the shop draft. Uses a free reroll if available, otherwise costs $25.
     */
    rerollShopDraft(): boolean {
        const REROLL_COST = 25;
        if (this.state.shopRerollsLeft > 0) {
            this.state.shopRerollsLeft--;
        } else {
            if (this.state.money < REROLL_COST) return false;
            this.state.money -= REROLL_COST;
        }
        this.generateShopDraft(true);
        return true;
    }

    initializeTournament(tournamentIndex: number) {
        this.state.currentTournamentIndex = tournamentIndex;
        this.state.currentHoleIndex = 0;
        this.state.cumulativeTournamentPoints = 0;

        // Apply any pending extra strokes purchased in shop
        const extraStrokes = this.state.pendingExtraStrokes;
        this.state.pendingExtraStrokes = 0;

        // Generate scorecards for the 3 holes
        const tourneyDef = TOURNAMENT_DATA[tournamentIndex];
        this.state.scorecardList = tourneyDef.holes.map((hole, index) => ({
            holeIndex: index,
            par: hole.par,
            targetScore: Math.round(tourneyDef.cutTarget / 3 * (1 + index * 0.2)),
            strokesTaken: 0,
            totalPoints: 0,
            dnf: false,
            pointsPerShot: []
        }));

        this.loadHole(0);

        // Apply extra strokes after hole load (loadHole resets to par strokes)
        if (extraStrokes > 0) {
            this.state.allowedStrokes += extraStrokes;
        }

        // Clear old shop draft for this new tournament
        this.state.shopDraft = [];
    }

    loadHole(holeIndex: number) {
        this.state.currentHoleIndex = holeIndex;
        const scorecard = this.state.scorecardList[holeIndex];

        // Reset per-hole variables
        this.state.allowedStrokes = scorecard.par;
        this.state.mulligansLeft = 2;
        this.state.strokeIndex = 1;
        this.state.currentFrame = null;
        this.state.mulliganHistory = [];
        this.state.ball.vel = { x: 0, y: 0 };
        this.state.ball.isMoving = false;

        // Find Tee Box (tile 0) in the current map grid to place the ball
        const mapGrid = TOURNAMENT_DATA[this.state.currentTournamentIndex].holes[holeIndex].map;
        let teeFound = false;
        for (let r = 0; r < 12; r++) {
            for (let c = 0; c < 16; c++) {
                if (mapGrid[r][c] === 0) {
                    this.state.ball.pos = {
                        x: c * 32 + 16,
                        y: r * 32 + 16
                    };
                    this.state.ball.currentTileId = 0;
                    teeFound = true;
                    break;
                }
            }
            if (teeFound) break;
        }

        if (!teeFound) {
            this.state.ball.pos = { x: 48, y: 112 };
            this.state.ball.currentTileId = 0;
        }

        // Generate dynamic wind vector for this hole (only from Tournament 3 onwards)
        if (this.state.currentTournamentIndex >= 2) {
            const windAngle = Math.random() * Math.PI * 2;
            const windSpeed = 1.0 + Math.random() * 3.5;
            this.state.wind = {
                x: Math.cos(windAngle) * windSpeed,
                y: Math.sin(windAngle) * windSpeed
            };
        } else {
            this.state.wind = { x: 0, y: 0 };
        }
    }

    saveMulliganSnapshot() {
        const scorecardCopy: HoleScorecard[] = this.state.scorecardList.map(card => ({
            ...card,
            pointsPerShot: [...card.pointsPerShot]
        }));

        this.state.mulliganHistory.push({
            ballPos: { ...this.state.ball.pos },
            allowedStrokes: this.state.allowedStrokes,
            mulligansLeft: this.state.mulligansLeft,
            scorecardList: scorecardCopy,
            cumulativeTournamentPoints: this.state.cumulativeTournamentPoints,
            strokeIndex: this.state.strokeIndex,
            pointsPerShotLog: [...this.state.scorecardList[this.state.currentHoleIndex].pointsPerShot]
        });
    }

    applyMulligan() {
        if (this.state.mulligansLeft <= 0 || this.state.mulliganHistory.length === 0) return false;

        const snapshot = this.state.mulliganHistory.pop()!;

        this.state.ball.pos = { ...snapshot.ballPos };
        this.state.ball.vel = { x: 0, y: 0 };
        this.state.ball.isMoving = false;

        this.state.allowedStrokes = snapshot.allowedStrokes;
        this.state.scorecardList = snapshot.scorecardList;
        this.state.cumulativeTournamentPoints = snapshot.cumulativeTournamentPoints;
        this.state.strokeIndex = snapshot.strokeIndex;

        this.state.mulligansLeft--;
        this.state.currentFrame = null;

        const gridX = Math.floor(this.state.ball.pos.x / 32);
        const gridY = Math.floor(this.state.ball.pos.y / 32);
        this.state.ball.currentTileId = TOURNAMENT_DATA[this.state.currentTournamentIndex].holes[this.state.currentHoleIndex].map[gridY]?.[gridX] ?? 1;

        audio.playMulligan();
        return true;
    }

    takeTelemetryDrop() {
        if (this.state.ball.currentTileId !== 4 || this.state.ball.isMoving) return false;

        const mapGrid = TOURNAMENT_DATA[this.state.currentTournamentIndex].holes[this.state.currentHoleIndex].map;
        let closestDist = Infinity;
        let targetPos: Vector2D = { x: 50, y: 100 };
        let found = false;

        for (let r = 0; r < 12; r++) {
            for (let c = 0; c < 16; c++) {
                if (mapGrid[r][c] === 1) {
                    const fx = c * 32 + 16;
                    const fy = r * 32 + 16;
                    const dx = this.state.ball.pos.x - fx;
                    const dy = this.state.ball.pos.y - fy;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < closestDist) {
                        closestDist = distSq;
                        targetPos = { x: fx, y: fy };
                        found = true;
                    }
                }
            }
        }

        if (found) {
            this.state.ball.pos = targetPos;
            this.state.ball.currentTileId = 1;
            this.state.cumulativeTournamentPoints = Math.max(0, this.state.cumulativeTournamentPoints - 500);
            const scorecard = this.state.scorecardList[this.state.currentHoleIndex];
            scorecard.totalPoints = Math.max(0, scorecard.totalPoints - 500);
            this.state.currentFrame = null;
            return true;
        }

        return false;
    }

    earnCash(amount: number) {
        this.state.money += amount;
    }

    buyShopClub(club: ClubModifier) {
        if (this.state.money >= club.cost && !this.state.inventoryClubs.includes(club.id)) {
            this.state.money -= club.cost;
            this.state.inventoryClubs.push(club.id);
            const coreClubDef = DRAFTABLE_CLUBS.find(c => c.id === club.id);
            if (coreClubDef) {
                this.state.activeBag.push(coreClubDef);
            }
            return true;
        }
        return false;
    }

    buyShopSleeve(sleeve: SleeveModifier) {
        if (this.state.money >= sleeve.cost && !this.state.inventorySleeves.includes(sleeve.id)) {
            this.state.money -= sleeve.cost;
            this.state.inventorySleeves.push(sleeve.id);
            const coreSleeveDef = DRAFTABLE_SLEEVES.find(s => s.id === sleeve.id);
            if (coreSleeveDef) {
                this.state.activeSleeve = coreSleeveDef;
            }
            return true;
        }
        return false;
    }

    /** Buy a shop draft item by its index in state.shopDraft */
    buyDraftItem(idx: number): boolean {
        const item = this.state.shopDraft[idx];
        if (!item) return false;
        if (this.state.money < item.price) return false;

        if (item.type === 'club') {
            const club = item.ref as ClubModifier;
            if (this.state.inventoryClubs.includes(club.id)) return false;
            this.state.money -= item.price;
            this.state.inventoryClubs.push(club.id);
            const def = DRAFTABLE_CLUBS.find(c => c.id === club.id);
            if (def) this.state.activeBag.push(def);
            return true;
        }

        if (item.type === 'sleeve') {
            const sleeve = item.ref as SleeveModifier;
            if (this.state.inventorySleeves.includes(sleeve.id)) return false;
            this.state.money -= item.price;
            this.state.inventorySleeves.push(sleeve.id);
            const def = DRAFTABLE_SLEEVES.find(s => s.id === sleeve.id);
            if (def) this.state.activeSleeve = def;
            return true;
        }

        if (item.type === 'mulligan') {
            this.state.money -= item.price;
            this.state.mulligansLeft += (item.amount ?? 1);
            this.state.shopDraft.splice(idx, 1);
            return true;
        }

        if (item.type === 'stroke_boost') {
            this.state.money -= item.price;
            this.state.pendingExtraStrokes += (item.amount ?? 1);
            this.state.shopDraft.splice(idx, 1);
            return true;
        }

        if (item.type === 'cash_boost') {
            this.state.money -= item.price;
            this.state.money += (item.amount ?? 0);
            this.state.shopDraft.splice(idx, 1);
            return true;
        }

        if (item.type === 'gamble') {
            this.state.money -= item.price;
            const won = Math.random() < 0.5;
            if (won) this.state.money += (item.amount ?? 0);
            this.state.lastGambleResult = { won, amount: item.amount ?? 0 };
            this.state.shopDraft.splice(idx, 1);
            return true;
        }

        return false;
    }
}
