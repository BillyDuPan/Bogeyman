import type { GameState, ClubModifier, SleeveModifier, HoleScorecard, Vector2D, ShopDraftItem, TournamentResult } from '../types/game';
import { TOURNAMENT_DATA } from '../config/terrain';
import { audio } from './AudioSynthesizer';
import { DEFAULT_CLUBS, DRAFTABLE_CLUBS, DRAFTABLE_SLEEVES, SHOP_CONSUMABLE_POOL, DRAFTABLE_BLOCKS, PASSIVE_BUFF_POOL } from '../config/items';
import type { Rarity } from '../types/game';

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
            selectedClubId: 'std_9iron',
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
            currentRerollCost: 10,
            blocksBoughtThisSession: 0,
            passiveBuffs: [],
            lastGambleResult: null,
            shopCollapsed: false,
            blockInventory: {},
            placedBlocks: [],
            buildModeTileId: null
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

    private rollRarity(): Rarity {
        const rand = Math.random();
        if (rand < 0.5) return 'Common';
        if (rand < 0.75) return 'Uncommon';
        if (rand < 0.9) return 'Rare';
        if (rand < 0.98) return 'Epic';
        return 'Legendary';
    }

    private getRarityScalar(rarity: Rarity): number {
        switch (rarity) {
            case 'Common': return 1.0;
            case 'Uncommon': return 1.2;
            case 'Rare': return 1.5;
            case 'Epic': return 2.0;
            case 'Legendary': return 3.0;
        }
    }

    /**
     * Generate a fresh shop draft. Called after a tournament cut or on reroll.
     * Pass isReroll=true to preserve the reroll counter.
     */
    generateShopDraft(isReroll = false) {
        if (!isReroll) {
            this.state.currentRerollCost = 10;
            this.state.blocksBoughtThisSession = 0;
            this.state.lastGambleResult = null;
        }

        const items: ShopDraftItem[] = [];

        // 1 random unowned club
        const availableClubs = DRAFTABLE_CLUBS.filter(c => !this.state.inventoryClubs.includes(c.id));
        [...availableClubs].sort(() => 0.5 - Math.random()).slice(0, 1).forEach(club => {
            const rarity = this.rollRarity();
            const scalar = this.getRarityScalar(rarity);
            items.push({ id: club.id, name: `${rarity} ${club.name}`, description: club.description, price: Math.floor(club.cost * scalar), type: 'club', rarity, ref: { ...club, powerScalar: club.powerScalar * scalar } });
        });

        // 1 random unowned sleeve
        const availableSleeves = DRAFTABLE_SLEEVES.filter(s => !this.state.inventorySleeves.includes(s.id));
        [...availableSleeves].sort(() => 0.5 - Math.random()).slice(0, 1).forEach(sleeve => {
            const rarity = this.rollRarity();
            const scalar = this.getRarityScalar(rarity);
            items.push({ id: sleeve.id, name: `${rarity} ${sleeve.name}`, description: sleeve.description, price: Math.floor(sleeve.cost * scalar), type: 'sleeve', rarity, ref: { ...sleeve, elasticity: Math.min(1.0, sleeve.elasticity * (1 + (scalar - 1) * 0.1)) } });
        });

        if (isReroll) {
            // Keep existing non-equipment items
            const preservedItems = this.state.shopDraft.filter(item => item.type !== 'club' && item.type !== 'sleeve');
            this.state.shopDraft = [...items, ...preservedItems];
        } else {
            // Generate Block and Specials
            // 1 random block (if none bought this session)
            if (this.state.blocksBoughtThisSession === 0) {
                [...DRAFTABLE_BLOCKS].sort(() => 0.5 - Math.random()).slice(0, 1).forEach(block => {
                    let rarity: Rarity = 'Common';
                    if (block.tileId === 6) rarity = 'Uncommon';
                    else if (block.tileId === 8 || block.tileId === 9) rarity = 'Rare';
                    else if (block.tileId >= 12 && block.tileId <= 15) rarity = Math.random() < 0.5 ? 'Epic' : 'Legendary';
                    const scalar = this.getRarityScalar(rarity);

                    items.push({
                        id: `block_${block.tileId}`,
                        name: `${rarity} ${block.name}`,
                        description: block.description,
                        price: Math.floor(block.cost * scalar),
                        type: 'block',
                        rarity,
                        ref: block
                    });
                });
            }

            // 1 gamble item
            const gambleItems = SHOP_CONSUMABLE_POOL.filter(c => c.type === 'gamble');
            if (gambleItems.length > 0) {
                const randomGamble = gambleItems[Math.floor(Math.random() * gambleItems.length)];
                items.push({ ...randomGamble, ref: null });
            }

            // 1 instant buff or passive (non-gamble)
            const buffItems = SHOP_CONSUMABLE_POOL.filter(c => c.type !== 'gamble');
            if (buffItems.length > 0) {
                const randomBuff = buffItems[Math.floor(Math.random() * buffItems.length)];
                if (randomBuff.type === 'passive') {
                    const rarity = this.rollRarity();
                    const scalar = this.getRarityScalar(rarity);
                    items.push({ ...randomBuff, name: `${rarity} ${randomBuff.name}`, price: Math.floor(randomBuff.price * scalar), rarity, ref: null });
                } else {
                    items.push({ ...randomBuff, ref: null });
                }
            }

            this.state.shopDraft = items;
        }
    }

    /**
     * Reroll the shop draft. Costs money and increases each time.
     */
    rerollShopDraft(): boolean {
        const cost = this.state.currentRerollCost;
        if (this.state.money < cost) return false;
        
        this.state.money -= cost;
        this.state.currentRerollCost += 10;
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

        // Reclaim placed blocks back to block inventory
        this.reclaimAllPlacedBlocks();
        this.state.buildModeTileId = null;

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
        
        const activeMap = this.getActiveMapGrid();
        this.state.ball.currentTileId = activeMap[gridY]?.[gridX] ?? 1;

        audio.playMulligan();
        return true;
    }

    takeTelemetryDrop() {
        if (this.state.ball.currentTileId !== 4 || this.state.ball.isMoving) return false;

        const mapGrid = this.getActiveMapGrid();
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

        if (item.type === 'block') {
            this.state.money -= item.price;
            const block = item.ref;
            this.state.blockInventory[block.tileId] = (this.state.blockInventory[block.tileId] || 0) + 1;
            this.state.blocksBoughtThisSession++;
            this.state.shopDraft.splice(idx, 1);
            return true;
        }

        if (item.type === 'passive') {
            this.state.money -= item.price;
            const baseBuff = PASSIVE_BUFF_POOL[Math.floor(Math.random() * PASSIVE_BUFF_POOL.length)];
            const rarity = item.rarity || 'Common';
            const scalar = this.getRarityScalar(rarity);

            this.state.passiveBuffs.push({
                ...baseBuff,
                rarity,
                baseYardsBonus: baseBuff.baseYardsBonus ? baseBuff.baseYardsBonus * scalar : undefined,
                wallBounceMultiplierBonus: baseBuff.wallBounceMultiplierBonus ? baseBuff.wallBounceMultiplierBonus * scalar : undefined,
                sandRoughPenaltyReduction: baseBuff.sandRoughPenaltyReduction ? baseBuff.sandRoughPenaltyReduction * scalar : undefined,
                cashPerHole: baseBuff.cashPerHole ? Math.floor(baseBuff.cashPerHole * scalar) : undefined,
                projectionRayLengthBonus: baseBuff.projectionRayLengthBonus ? baseBuff.projectionRayLengthBonus * scalar : undefined
            });

            this.state.shopDraft.splice(idx, 1);
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

    /** Place a block from inventory onto the active hole grid */
    placeBlock(r: number, c: number, tileId: number): boolean {
        const invTileId = (tileId >= 12 && tileId <= 15) ? 12 : tileId;
        const count = this.state.blockInventory[invTileId] || 0;
        if (count <= 0) return false;

        const baseMap = TOURNAMENT_DATA[this.state.currentTournamentIndex].holes[this.state.currentHoleIndex].map;
        if (r < 0 || r >= 12 || c < 0 || c >= 16) return false;

        const baseTile = baseMap[r][c];
        // Cannot overwrite Tee Box (0), Cup (5), or Slate Wall boundaries (7)
        if (baseTile === 0 || baseTile === 5 || baseTile === 7) return false;

        // Cannot place directly on top of the ball
        const ballGridX = Math.floor(this.state.ball.pos.x / 32);
        const ballGridY = Math.floor(this.state.ball.pos.y / 32);
        if (ballGridX === c && ballGridY === r) return false;

        // Reclaim existing custom block at this location if one was placed
        const existingIdx = this.state.placedBlocks.findIndex(b => b.r === r && b.c === c);
        if (existingIdx >= 0) {
            this.removeBlock(r, c);
        }

        this.state.placedBlocks.push({
            r,
            c,
            tileId,
            originalTileId: baseTile
        });

        this.state.blockInventory[invTileId]--;
        return true;
    }

    /** Remove a placed block and restore the original tile */
    removeBlock(r: number, c: number): boolean {
        const idx = this.state.placedBlocks.findIndex(b => b.r === r && b.c === c);
        if (idx < 0) return false;

        const block = this.state.placedBlocks[idx];
        this.state.placedBlocks.splice(idx, 1);

        const invTileId = (block.tileId >= 12 && block.tileId <= 15) ? 12 : block.tileId;
        this.state.blockInventory[invTileId] = (this.state.blockInventory[invTileId] || 0) + 1;
        return true;
    }

    /** Sweep all placed blocks back into inventory */
    reclaimAllPlacedBlocks() {
        if (!this.state.placedBlocks) return;
        for (const block of this.state.placedBlocks) {
            const invTileId = (block.tileId >= 12 && block.tileId <= 15) ? 12 : block.tileId;
            this.state.blockInventory[invTileId] = (this.state.blockInventory[invTileId] || 0) + 1;
        }
        this.state.placedBlocks = [];
    }

    /** Dynamically construct the active map including player-placed blocks */
    getActiveMapGrid(): number[][] {
        const baseMap = TOURNAMENT_DATA[this.state.currentTournamentIndex].holes[this.state.currentHoleIndex].map;
        const grid = baseMap.map(row => [...row]);
        for (const b of this.state.placedBlocks) {
            grid[b.r][b.c] = b.tileId;
        }
        return grid;
    }
}
