import type { ClubModifier, SleeveModifier, ShopDraftItem } from '../types/game';

// Base Starting Clubs (Cursed hand-me-downs from fallen golfers)
export const DEFAULT_CLUBS: ClubModifier[] = [
    {
        id: 'std_driver',
        name: 'Standard Driver',
        description: 'Standard long-distance driver. 2.0x Power.',
        clubType: 'Driver',
        powerScalar: 2.0,
        cost: 0
    },
    {
        id: 'std_5iron',
        name: '5-Iron',
        description: 'Medium-distance iron. 1.3x Power.',
        clubType: 'Iron',
        powerScalar: 1.3,
        cost: 0
    },
    {
        id: 'std_9iron',
        name: '9-Iron',
        description: 'Short-distance iron. 1.1x Power.',
        clubType: 'Iron',
        powerScalar: 1.1,
        cost: 0
    },
    {
        id: 'std_wedge',
        name: 'Wedge',
        description: 'High-loft wedge. 1.0x Power.',
        clubType: 'Wedge',
        powerScalar: 1.0,
        cost: 0
    },
    {
        id: 'std_putter',
        name: 'Putter',
        description: 'Green only. Smooth roller. 0.8x Power.',
        clubType: 'Putter',
        powerScalar: 0.8,
        cost: 0
    }
];

// Cursed Relic Clubs (unearthed from the Bogeyman's course)
export const DRAFTABLE_CLUBS: ClubModifier[] = [
    {
        id: 'illegal_1iron',
        name: 'Power 1-Iron',
        description: 'Superpowered 2.5x shot. Wall bounces reset multiplier to 1.0x.',
        clubType: 'Iron',
        powerScalar: 2.5,
        cost: 120
    },
    {
        id: 'sand_wedge_60',
        name: 'Sand Wedge',
        description: 'Sand Wedge. Bunker multiplier counts as 5.0x instead of 0.3x.',
        clubType: 'Wedge',
        powerScalar: 0.9,
        cost: 85
    },
    {
        id: 'beryllium_putter',
        name: 'Bounce Putter',
        description: 'Green only. Bounces add +100 yards base distance.',
        clubType: 'Putter',
        powerScalar: 0.8,
        cost: 100
    },
    {
        id: 'titanium_driver',
        name: 'Tee-Box Driver',
        description: 'High-power 2.3x driver. Adds +100 yards base on the Tee Box.',
        clubType: 'Driver',
        powerScalar: 2.3,
        cost: 130
    },
    {
        id: 'golden_putter',
        name: 'Multiplier Putter',
        description: 'Green only. Doubles final points earned on this shot.',
        clubType: 'Putter',
        powerScalar: 0.7,
        cost: 140
    },
    {
        id: 'heavy_hybrid',
        name: 'Rough-Bypass Hybrid',
        description: 'Versatile 1.5x hybrid. Ignores rough penalty (Rough Lie = 1.0x).',
        clubType: 'Iron',
        powerScalar: 1.5,
        cost: 110
    },
    {
        id: 'trick_wedge',
        name: 'Bounce Wedge',
        description: 'Trick Wedge. Bounces add +1.0x multiplier instead of +0.5x.',
        clubType: 'Wedge',
        powerScalar: 1.0,
        cost: 95
    }
];

// Consumable & special items available in the shop pool
export const SHOP_CONSUMABLE_POOL: Array<Omit<ShopDraftItem, 'ref'>> = [
    {
        id: 'refill_mulligan',
        name: 'Mulligan Charge (+1)',
        description: 'Rewind time to retry a shot. +1 Mulligan charge.',
        price: 35,
        type: 'mulligan',
        amount: 1
    },
    {
        id: 'ectoplasm_flask',
        name: 'Mulligan Pack (+2)',
        description: 'Get a head start. +2 Mulligan charges for next round.',
        price: 70,
        type: 'mulligan',
        amount: 2
    },
    {
        id: 'extra_stroke',
        name: 'Extra Stroke (+1)',
        description: 'Increase shot limit. +1 stroke allowed next tournament.',
        price: 60,
        type: 'stroke_boost',
        amount: 1
    },
    {
        id: 'bone_cache',
        name: 'Extra Stroke Pack (+3)',
        description: 'Increase shot limit. +3 strokes allowed next tournament.',
        price: 115,
        type: 'stroke_boost',
        amount: 3
    },
    {
        id: 'soul_vault',
        name: 'Gold Converter ($40 -> $100)',
        description: 'Convert $40 of cash into $100 (+$60 net cash).',
        price: 40,
        type: 'cash_boost',
        amount: 100
    },
    {
        id: 'reapers_wager',
        name: 'Double-or-Nothing Wager ($20)',
        description: 'Pay $20. 50% chance to win $200, 50% chance to lose the $20.',
        price: 20,
        type: 'gamble',
        amount: 200
    },
];

// Spirit Ball Sleeves (vessels of supernatural energy)
export const DRAFTABLE_SLEEVES: SleeveModifier[] = [
    {
        id: 'std_sleeve',
        name: 'Standard Ball',
        description: 'Standard golf ball. 0.85 bounce elasticity.',
        elasticity: 0.85,
        windImmunity: false,
        cost: 0
    },
    {
        id: 'balata_sleeve',
        name: 'High-Elasticity Ball',
        description: 'High-elasticity balata ball. 0.96 bounce.',
        elasticity: 0.96,
        windImmunity: false,
        cost: 110
    },
    {
        id: 'lowspin_sleeve',
        name: 'Wind-Immune Ball',
        description: 'Aerodynamic ball. Immune to wind drift.',
        elasticity: 0.85,
        windImmunity: true,
        cost: 100
    },
    {
        id: 'super_bouncer',
        name: 'Super-Bounce Ball',
        description: 'Maximum-elasticity ball. 0.98 bounce.',
        elasticity: 0.98,
        windImmunity: false,
        cost: 140
    }
];

export interface BlockModifier {
    tileId: number;
    name: string;
    description: string;
    cost: number;
}

// Purchaseable Map Blocks
export const DRAFTABLE_BLOCKS: BlockModifier[] = [
    {
        tileId: 8,
        name: 'Arcade Bumper',
        description: 'Bounces ball & adds +150 yds & +0.5x multiplier.',
        cost: 45
    },
    {
        tileId: 9,
        name: 'Multiplier Gate',
        description: 'Sensor gate that doubles current shot multiplier.',
        cost: 60
    },
    {
        tileId: 6,
        name: 'Green Patch',
        description: 'Smooth putting terrain. Best for putter (1.3x lie).',
        cost: 25
    },
    {
        tileId: 1,
        name: 'Fairway Patch',
        description: 'Fills sand/rough/water with standard fairway (1.0x lie).',
        cost: 15
    }
];
