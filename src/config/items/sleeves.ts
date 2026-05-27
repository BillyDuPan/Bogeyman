import type { SleeveModifier } from '../../types/game';

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
