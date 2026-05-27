export interface Vector2D {
    x: number;
    y: number;
}

export interface TerrainType {
    id: number;
    name: string;
    friction: number;
    lieModifier: number;
    color: string;
    description: string;
}

export interface BallEntity {
    pos: Vector2D;
    vel: Vector2D;
    radius: number;
    isMoving: boolean;
    currentTileId: number;
}

export interface StrokeFrame {
    strokeIndex: number;
    initialLieType: number;
    startingPos: Vector2D;
    accumulatedBaseYards: number;
    accumulatedMultiplier: number;
    collisionLog: string[];
    bankShotCount: number;
    bumperHitCount: number;
    gateCrossedCount: number;
    waterSkimCount: number;
    clubUsedId: string;
}

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface ClubModifier {
    id: string;
    name: string;
    description: string;
    clubType: 'Driver' | 'Iron' | 'Wedge' | 'Putter';
    powerScalar: number;
    cost: number;
    rarity?: Rarity;
    hooks?: {
        onAddress?: (frame: StrokeFrame) => void;
        onFrameTick?: (ball: BallEntity, frame: StrokeFrame) => void;
        onCollision?: (frame: StrokeFrame, type: 'wall' | 'bumper') => void;
        onSettle?: (frame: StrokeFrame) => void;
    };
}

export interface SleeveModifier {
    id: string;
    name: string;
    description: string;
    elasticity: number;
    windImmunity: boolean;
    cost: number;
    rarity?: Rarity;
}

export interface PassiveBuff {
    id: string;
    name: string;
    description: string;
    rarity: Rarity;
    // Multipliers or additions for various stats
    baseYardsBonus?: number;
    wallBounceMultiplierBonus?: number;
    sandRoughPenaltyReduction?: number; // e.g., 0.1 means adds 0.1 to lie modifier
    cashPerHole?: number;
    projectionRayLengthBonus?: number;
}


export interface ConsumableItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    effectType: 'mulligan' | 'cash_boost' | 'stroke_boost';
    amount: number;
}

export interface HoleScorecard {
    holeIndex: number;
    par: number;
    targetScore: number;
    strokesTaken: number;
    totalPoints: number;
    dnf: boolean;
    pointsPerShot: number[];
}

export interface TournamentDef {
    id: number;
    name: string;
    cutTarget: number;
    parValues: number[];
    holeScores: number[];
    rewardCash: number;
}

export interface HistoryState {
    ballPos: Vector2D;
    allowedStrokes: number;
    mulligansLeft: number;
    scorecardList: HoleScorecard[];
    cumulativeTournamentPoints: number;
    strokeIndex: number;
    pointsPerShotLog: number[];
}

/** A single item available in the post-cut shop draft */
export interface ShopDraftItem {
    id: string;
    name: string;
    description: string;
    price: number;
    type: 'club' | 'sleeve' | 'mulligan' | 'stroke_boost' | 'cash_boost' | 'gamble' | 'block' | 'passive';
    rarity?: Rarity;
    /** For mulligan: charges granted. For stroke_boost: strokes granted. For cash_boost: gold received. For gamble: win amount. */
    amount?: number;
    ref: any;
}

/** Stores the result of one completed tournament */
export interface TournamentResult {
    tournamentIndex: number;
    name: string;
    score: number;
    cutTarget: number;
    passed: boolean;
    cashEarned: number;
}

export interface GameState {
    money: number;
    currentTournamentIndex: number;
    currentHoleIndex: number;
    allowedStrokes: number;
    mulligansLeft: number;
    cumulativeTournamentPoints: number;
    selectedClubId: string;
    activeBag: ClubModifier[];
    activeSleeve: SleeveModifier;
    inventoryClubs: string[];
    inventorySleeves: string[];
    scorecardList: HoleScorecard[];
    ball: BallEntity;
    strokeIndex: number;
    currentFrame: StrokeFrame | null;
    gameMode: 'title' | 'locker' | 'play' | 'shop' | 'gameover' | 'victory' | 'results';
    wind: Vector2D;
    mulliganHistory: HistoryState[];
    sfxVolume: number;
    musicVolume: number;
    selectedTrack: string;
    /** Persistent shop items for the current between-round draft */
    shopDraft: ShopDraftItem[];
    /** History of all completed tournament results */
    tournamentResults: TournamentResult[];
    /** Extra strokes purchased from shop (applied on next tournament start) */
    pendingExtraStrokes: number;
    /** Current cost of the shop reroll */
    currentRerollCost: number;
    /** Whether a block has been purchased this shop session */
    blocksBoughtThisSession: number;
    /** List of acquired passive buffs */
    passiveBuffs: PassiveBuff[];
    /** Set after a gamble resolves so the UI can display the outcome */
    lastGambleResult: { won: boolean; amount: number } | null;
    /** Whether the shop UI is collapsed/hidden in the locker room */
    shopCollapsed?: boolean;
    /** Player's placeable blocks inventory: mapping tileId to count owned */
    blockInventory: Record<number, number>;
    /** Placed blocks on the active hole map */
    placedBlocks: Array<{ r: number; c: number; tileId: number; originalTileId: number }>;
    /** Currently selected tileId for Build Mode, if any */
    buildModeTileId: number | null;
}
