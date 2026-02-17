// ============================
// Role Definitions
// ============================

export type RoleType = 'ninja' | 'tank' | 'mage' | 'builder';

export interface Role {
    id: RoleType;
    name: string;
    emoji: string;
    description: string;
    ability: string;
}

export const ROLES: Role[] = [
    {
        id: 'ninja',
        name: 'Ninja',
        emoji: '🥷',
        description: 'Lincah dan sulit ditangkap!',
        ability: '50% peluang menghindari ular (tidak turun).'
    },
    {
        id: 'tank',
        name: 'Tank',
        emoji: '🛡️',
        description: 'Kuat dan tahan banting!',
        ability: 'Kebal terhadap kartu serangan (Kutukan, Skip, Tukar Posisi).'
    },
    {
        id: 'mage',
        name: 'Mage',
        emoji: '🧙‍♂️',
        description: 'Ahli sihir yang licik!',
        ability: 'Mulai game dengan 1 kartu acak gratis.'
    },
    {
        id: 'builder',
        name: 'Builder',
        emoji: '🏗️',
        description: 'Ahli konstruksi!',
        ability: 'Naik tangga dapat bonus +2 langkah tambahan.'
    }
];

export function getRole(roleId: string): Role | undefined {
    return ROLES.find(r => r.id === roleId);
}
