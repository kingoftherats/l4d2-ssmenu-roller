export interface ssConfig {
    player2Name: string,
    exportToVpk: boolean,
    campaigns: ssConfigCampaign[],
    mutations: ssMutation[]
};

export interface ssConfigCampaign {
    name: string,
    chapters: ssMap[],
    survival: ssMap[],
    scavenge: ssMap[]
}

export interface ssMap {
    name: string,
    id: string
};

export interface ssMutation {
    name: string,
    id: string
};