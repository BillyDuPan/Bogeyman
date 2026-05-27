import type { ShopDraftItem } from '../../types/game';

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
    {
        id: 'mystery_box',
        name: 'Passive Mystery Box',
        description: 'Unbox a random passive buff to permanently enhance your stats!',
        price: 85,
        type: 'passive',
    }
];
