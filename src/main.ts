import * as path from 'path';
import fs from 'fs-extra';
import { parseMainMenuRes, stringifyMainMenuRes, stringifyBasicRes, mainMenuRes, resContainer, basicRes } from './util/res';
import { ssConfig, ssMap } from './util/config';
import { resProperty } from './util/res';

const exportPath: string = path.resolve(__dirname, './export');
const resourceFileRoot: string = `${exportPath}/resource/ui/l4d360ui`;

const resourceNameRoot: string = 'resource/UI/L4D360UI';

const ROW_HEIGHT: number = 21;
const WIDTH_PER_CHAR: number = 10;

const BACKGROUND_CONTAINER_TEMPLATE: resContainer = {
    name: 'PnlBackground',
    properties: [
        { name: 'ControlName', value: '"Panel"' },
        { name: 'fieldName', value: '"PnlBackground"' },
        { name: 'xpos', value: '"0"' },
        { name: 'ypos', value: '"0"' },
        { name: 'zpos', value: '"-1"' },
        { name: 'visible', value: '"1"' },
        { name: 'enabled', value: '"1"' },
        { name: 'paintbackground', value: '"1"' },
        { name: 'paintborder', value: '"1"' }
    ]
};

const BTN_PROPS_TEMPLATE: resProperty[] = [
    { name: 'ControlName', value: '"L4D360HybridButton"' },
    { name: 'xpos', value: '"0"' },
    { name: 'tall', value: '"20"' },
    { name: 'autoResize', value: '"1"' },
    { name: 'pinCorner', value: '"0"' },
    { name: 'visible', value: '"1"' },
    { name: 'enabled', value: '"1"' },
    { name: 'tabPosition', value: '"0"' },
    { name: 'wrap', value: '"1"' },
    { name: 'style', value: '"FlyoutMenuButton"' },
    { name: 'ActivationType', value: '"1"' }
];

enum GameType {
    Campaign = 'Campaign',
    Mutation = 'Mutation',
    Realism = 'Realism',
    Survival = 'Survival',
    Scavenge = 'Scavenge'
};

enum Difficulty {
    Easy = 'Easy',
    Normal = 'Normal',
    Advanced = 'Advanced',
    Expert = 'Expert'
}

/**
 * Cleanup any previously exported resources
 */
const cleanup = (): void => {
    try {
        fs.rmSync(exportPath, { recursive:true, force: true });
    } catch { }

    fs.mkdirSync(resourceFileRoot, { recursive: true });
}

/**
 * Get a new flyout resource background container of the given height
 * @param height the container height
 * @returns a flyou background container
 */
const getBackgroundContainer = (rows: number, maxChars: number): resContainer => {
    const bkgCont: resContainer = Object.assign({}, BACKGROUND_CONTAINER_TEMPLATE);
    bkgCont.properties = [
        ...bkgCont.properties,
        { name: 'tall', value: `"${(ROW_HEIGHT*rows) + (ROW_HEIGHT/2)}"` },
        { name: 'wide', value: `"${WIDTH_PER_CHAR*maxChars}"` }
    ];
    return bkgCont;
};

/**
 * Get a container that maps a command to a flyout
 * @param resName the resource name for the command and flyout
 * @returns a resource container
 */
const getMainMenuCommandContainer = (resName: string): resContainer => {
    return {
        name: `Flm${resName}Flyout`,
        properties: [
            { name: 'ControlName', value: '"FlyoutMenu"' },
            { name: 'fieldName', value: `"Flm${resName}Flyout"` },
            { name: 'visible', value: '"0"' },
            { name: 'wide', value: '"0"' },
            { name: 'tall', value: '"0"' },
            { name: 'zpos', value: '"3"' },
            { name: 'InitialFocus', value: '"Btn0"' },
            { name: 'ResourceFile', value: `"${resourceNameRoot}/${resName}Flyout.res"` }
        ]
    };
};

/**
 * Get a container that represents a game mode
 * @param resName the resource name for the mode command
 * @returns a resource container
 */
const getMainMenuModeContainer = (resName: string): resContainer => {
    return {
        name: 'mode',
        properties: [
            { name: 'id', value: `"Btn${resName}"` },
            { name: 'name', value: `"${resName}"` },
            { name: 'image', value: '"vgui/menu_mode_offline_coop"' },
            { name: 'command', value: `"Flm${resName}Flyout"` },
            { name: 'menutitle', value: '""' },
            { name: 'menuhint', value: '""' }
        ]
    };
};

/**
 * Setup the next and previous naviation entries within a flyout
 * @param cont the target container (the current entry) within the flyout
 * @param idx the index of the current entry
 * @param total the total number of entries
 */
const applyContainerNavProps = (cont: resContainer, idx: number, total: number): void => {
    if (idx === 0)
        cont.properties.push({ name: 'navUp', value: `"Btn${total - 1}"` });
    else
        cont.properties.push({ name: 'navUp', value: `"Btn${idx - 1}"` });

    if (idx === total - 1)
        cont.properties.push({ name: 'navDown', value: '"Btn0"' });
    else
        cont.properties.push({ name: 'navDown', value: `"Btn${idx + 1}"` });
};

/**
 * Create the base split-screen menu resources in the main menu resource
 * @param config the split-screen config
 * @param mainMenu the main menu resource
 */
const createSplitScreenModeMenu = (config: ssConfig, mainMenu: mainMenuRes): void => {
    const gameTypesResName: string = 'SplitGameTypes';
    const ssMode: resContainer = { name: 'mode', properties: [
            { name: 'id', value: '"BtnSS"' },
            { name: 'name', value: 'Split-Screen' },
            { name: 'image', value: '"vgui/menu_mode_offline_coop"' },
            { name: 'command', value: `"Flm${gameTypesResName}Flyout"` },
            { name: 'menutitle', value: '"SPLIT-SCREEN"' },
            { name: 'menuhint', value: '"Play Split-Screen"' },
        ]
    };
    mainMenu.gameModes.modes.push(ssMode);

    //Copy most of the main game modes container props to split screen game modes and set to invisible
    mainMenu.gameModesSplit.properties = [
        ...mainMenu.gameModes.properties.filter(x => x.name !== 'fieldName'),
        { name: 'fieldName', value: `"${mainMenu.gameModesSplit}"` },
        { name: 'visible', value: '"0"' }
    ];

    mainMenu.containers.push({ name: `Flm${gameTypesResName}Flyout`, properties: [
            { name: 'ControlName', value: '"FlyoutMenu"' },
            { name: 'fieldName', value: `"Flm${gameTypesResName}Flyout"` },
            { name: 'visible', value: '"0"' },
            { name: 'wide', value: '"0"' },
            { name: 'tall', value: '"0"' },
            { name: 'zpos', value: '"3"' },
            { name: 'InitialFocus', value: '"Btn0"' },
            { name: 'ResourceFile', value: `"${resourceNameRoot}/${gameTypesResName}Flyout.res"` },
        ]
    });

    createGameTypesMenu(config, gameTypesResName, mainMenu);

    //The mainmenu will be changing as the nested menu is constructed to save it as the very last step
    fs.writeFileSync(`${resourceFileRoot}/mainmenu.res`, stringifyMainMenuRes(mainMenu));
};

/**
 * Create the game types menu flyout and link to the main menu
 * @param config the split-screen config
 * @param resName the name of the resource to be created
 * @param mainMenu the main menu resource
 */
const createGameTypesMenu = (config: ssConfig, resName: string, mainMenu: mainMenuRes): void => {
    const flyout: basicRes = { name: `Resource/UI/${resName}Flyout.res`, containers: [] };

    const bkgCont: resContainer = getBackgroundContainer(Object.keys(GameType).length,
        Object.keys(GameType).reduce((a, b) => a.length > b.length ? a : b).length);
    flyout.containers.push(bkgCont);

    let i = 0;
    for (let gameType in GameType) {
        const cont: resContainer = {
            name: `Btn${i}`,
            properties: [
                ...BTN_PROPS_TEMPLATE,
                { name: 'fieldName', value: `"Btn${i}"` },
                { name: 'labelText', value: `"${gameType}"` },
                { name: 'ypos', value: `"${i * ROW_HEIGHT}"` },
                { name: 'wide', value: `"${gameType.length * WIDTH_PER_CHAR}"` }
            ]
        };

        applyContainerNavProps(cont, i, Object.keys(GameType).length);

        const gameTypeResName: string = `Split${gameType}`;
        mainMenu.containers.push(getMainMenuCommandContainer(gameTypeResName));
        mainMenu.gameModesSplit.modes.push(getMainMenuModeContainer(gameTypeResName));

        cont.properties.push({ name: 'command', value: `"Flm${gameTypeResName}Flyout"` });
        flyout.containers.push(cont);

        if (gameType === GameType.Mutation)
            createMutationMenu(config, gameTypeResName, mainMenu);
        else
            createCampaignMenu(config, gameTypeResName, gameType as GameType, null, mainMenu);

        i++;
    }

    fs.writeFileSync(`${resourceFileRoot}/` + `${resName}Flyout.res`.toLocaleLowerCase(), stringifyBasicRes(flyout));
};

/**
 * Create the mutations menu flyout and link to the main menu
 * @param config the split-screen config
 * @param resName the name of the resource to be created
 * @param mainMenu the main menu resource
 */
const createMutationMenu = (config: ssConfig, resName: string, mainMenu: mainMenuRes): void => {
    const flyout: basicRes = { name: `Resource/UI/${resName}Flyout.res`, containers: [] };

    const bkgCont: resContainer = getBackgroundContainer(config.mutations.length,
        config.mutations.map(x => x.name).reduce((a, b) => a.length > b.length ? a : b).length);
    flyout.containers.push(bkgCont);

    for (let i = 0; i < config.mutations.length; i++) {
        const cont: resContainer = {
            name: `Btn${i}`,
            properties: [
                ...BTN_PROPS_TEMPLATE,
                { name: 'fieldName', value: `"Btn${i}"` },
                { name: 'labelText', value: `"${config.mutations[i].name}"` },
                { name: 'ypos', value: `"${i * ROW_HEIGHT}"` },
                { name: 'wide', value: `"${config.mutations[i].name.length * WIDTH_PER_CHAR}"` }
            ]
        };

        applyContainerNavProps(cont, i, config.mutations.length);

        const mutationResName: string = `SplitMutation${config.mutations[i].id}`;

        mainMenu.containers.push(getMainMenuCommandContainer(mutationResName));
        mainMenu.gameModesSplit.modes.push(getMainMenuModeContainer(mutationResName));

        cont.properties.push({ name: 'command', value: `"Flm${mutationResName}Flyout"` });
        flyout.containers.push(cont);

        createCampaignMenu(config, mutationResName, GameType.Mutation, config.mutations[i].id, mainMenu);
    }

    fs.writeFileSync(`${resourceFileRoot}/` + `${resName}Flyout.res`.toLocaleLowerCase(), stringifyBasicRes(flyout));
};

/**
 * Create the campaigns menu flyout and link to the main menu
 * @param config the split-screen config
 * @param resName the name of the resource to be created
 * @param gameType the game type (campaign, mutation, scavenge, etc.)
 * @param mutationId the mutation id or null if N/A
 * @param mainMenu the main menu resource
 */
const createCampaignMenu = (config: ssConfig, resName: string, gameType: GameType, mutationId: string | null, mainMenu: mainMenuRes): void => {
    const flyout: basicRes = { name: `Resource/UI/${resName}Flyout.res`, containers: [] };

    //Some campaigns don't have map entries for certain game types so make sure to compensate for that
    let totalCampaignsUsed = 0;
    switch(gameType) {
        case GameType.Survival:
            totalCampaignsUsed = config.campaigns.filter(x => x.survival.length > 0).length;
            break;
        case GameType.Scavenge:
            totalCampaignsUsed = config.campaigns.filter(x => x.scavenge.length > 0).length;
            break;
        default:
            totalCampaignsUsed = config.campaigns.filter(x => x.chapters.length > 0).length;
            break;
    }

    let i = 0;
    config.campaigns.forEach(campaign => {
        let campaignResName = '';
        const campaignNoSpaces: string = campaign.name.replace(/\s/g, '');
        switch(gameType) {
            case GameType.Campaign:
                campaignResName = `SplitCampaign${campaignNoSpaces}`;
                break;
            case GameType.Mutation:
                campaignResName = `Split${mutationId}${campaignNoSpaces}`;
                break;
            case GameType.Realism:
                campaignResName = `SplitRealism${campaignNoSpaces}`;
                break;
            case GameType.Survival:
                if (campaign.survival.length > 0)
                    campaignResName = `SplitSurvival${campaignNoSpaces}`;
                break;
            case GameType.Scavenge:
                if (campaign.scavenge.length > 0)
                    campaignResName = `SplitScavenge${campaignNoSpaces}`;
                break;
        }

        if (campaignResName.length > 0) {
            const cont: resContainer = {
                name: `Btn${i}`,
                properties: [
                    ...BTN_PROPS_TEMPLATE,
                    { name: 'fieldName', value: `"Btn${i}"` },
                    { name: 'labelText', value: `"${campaign.name}"` },
                    { name: 'ypos', value: `"${i * ROW_HEIGHT}"` },
                    { name: 'wide', value: `"${campaign.name.length * WIDTH_PER_CHAR}"` }
                ]
            };

            applyContainerNavProps(cont, i, totalCampaignsUsed);

            mainMenu.containers.push(getMainMenuCommandContainer(campaignResName));
            mainMenu.gameModesSplit.modes.push(getMainMenuModeContainer(campaignResName));

            cont.properties.push({ name: 'command', value: `"Flm${campaignResName}Flyout"` });
            flyout.containers.push(cont);

            createMapMenu(config, campaignResName, gameType as GameType, mutationId, campaign.name, mainMenu);

            i++;
        }
    });

    //Background at end because we may have "filtered" some N/A campaigns for the target game mode
    const bkgCont: resContainer = getBackgroundContainer(totalCampaignsUsed,
        config.campaigns.map(x => x.name).reduce((a, b) => a.length > b.length ? a : b).length);
    flyout.containers.unshift(bkgCont);

    fs.writeFileSync(`${resourceFileRoot}/` + `${resName}Flyout.res`.toLocaleLowerCase(), stringifyBasicRes(flyout));
};

/**
 * Create the maps menu flyout and link to the main menu. Generate start commands for scavenge and survival games types.
 * @param config the split-screen config
 * @param resName the name of the resource to be created
 * @param gameType the game type (campaign, mutation, scavenge, etc.)
 * @param mutationId the mutation id or null if N/A
 * @param campaignName the campaign name
 * @param mainMenu the main menu resource
 */
const createMapMenu = (config: ssConfig, resName: string, gameType: GameType, mutationId: string | null, campaignName: string, mainMenu: mainMenuRes): void => {
    const flyout: basicRes = { name: `Resource/UI/${resName}Flyout.res`, containers: [] };

    const campaign = config.campaigns.filter(x => x.name === campaignName)[0];

    let maps: ssMap[] = [];
    switch(gameType) {
        case GameType.Survival:
            maps = campaign.survival;
            break;
        case GameType.Scavenge:
            maps = campaign.scavenge;
            break;
        default:
            maps = campaign.chapters;
            break;
    }

    const campaignNoSpaces: string = campaignName.replace(/\s/g, '');

    const bkgCont: resContainer = getBackgroundContainer(maps.length,
        maps.map(x => x.name).reduce((a, b) => a.length > b.length ? a : b).length);
    flyout.containers.push(bkgCont);

    for (let i = 0; i < maps.length; i++) {
        const cont: resContainer = {
            name: `Btn${i}`,
            properties: [
                ...BTN_PROPS_TEMPLATE,
                { name: 'fieldName', value: `"Btn${i}"` },
                { name: 'labelText', value: `"${maps[i].name}"` },
                { name: 'ypos', value: `"${i * ROW_HEIGHT}"` },
                { name: 'wide', value: `"${maps[i].name.length * WIDTH_PER_CHAR}"` }
            ]
        };

        applyContainerNavProps(cont, i, maps.length);

        let mapResName = '';
        let mode = '';
        switch(gameType) {
            case GameType.Campaign:
                mapResName = `SplitCampaign${campaignNoSpaces}${maps[i].id}`;
                break;
            case GameType.Mutation:
                mapResName = `Split${mutationId}${campaignNoSpaces}${maps[i].id}`;
                break;
            case GameType.Realism:
                mapResName = `SplitRealism${campaignNoSpaces}${maps[i].id}`;
                break;
            case GameType.Survival:
                mode = 'survival';
                break;
            case GameType.Scavenge:
                mode = 'scavenge';
                break;
        }

        mainMenu.containers.push(getMainMenuCommandContainer(mapResName));
        mainMenu.gameModesSplit.modes.push(getMainMenuModeContainer(mapResName));

        if (mapResName.length > 0) {
            cont.properties.push({ name: 'command', value: `"Flm${mapResName}Flyout"` });
            createDifficultyMenu(mapResName, gameType as GameType, mutationId, maps[i].id);
        }
        else {
            cont.properties.push({ name: 'command', value: `"#sv_cheats 1;map ${maps[i].id} ${mode};wait 100;connect_splitscreen localhost 2"` });
        }

        flyout.containers.push(cont);
    }

    fs.writeFileSync(`${resourceFileRoot}/` + `${resName}Flyout.res`.toLocaleLowerCase(), stringifyBasicRes(flyout));
}

/**
 * Create the difficulty menu flyout and link to the main menu. Generates start commands for campaign type games.
 * @param resName the name of the resource to be created
 * @param gameType the game type (campaign, mutation, scavenge, etc.)
 * @param mutationId the mutation id or null if N/A
 * @param mapId the map id
 */
const createDifficultyMenu = (resName: string, gameType: GameType, mutationId: string | null, mapId: string): void => {
    const menu: basicRes = { name: `Resource/UI/${resName}.res`, containers: [] };

    let i = 0;
    for (let difficulty in Difficulty) {
        const cont: resContainer = {
            name: `Btn${i}`,
            properties: [
                ...BTN_PROPS_TEMPLATE,
                { name: 'fieldName', value: `"Btn${i}"` },
                { name: 'labelText', value: `"${difficulty}"` },
                { name: 'ypos', value: `"${i * ROW_HEIGHT}"` },
                { name: 'wide', value: `"${difficulty.length * WIDTH_PER_CHAR}"` }
            ]
        };

        applyContainerNavProps(cont, i, Object.keys(Difficulty).length);

        let mode = '';
        switch(gameType) {
            case GameType.Campaign:
                mode = 'coop';
                break;
            case GameType.Mutation:
                mode = mutationId as string;
                break;
            case GameType.Realism:
                mode = 'realism';
                break;
        }

        cont.properties.push({ name: 'command', value: `"#sv_cheats 1;map ${mapId} ${mode};z_difficulty ${difficulty};wait 100;connect_splitscreen localhost 2"` });
        menu.containers.push(cont);
        i++;
    }

    const bkgCont: resContainer = getBackgroundContainer(Object.keys(Difficulty).length,
        Object.keys(Difficulty).reduce((a, b) => a.length > b.length ? a : b).length);
    menu.containers.unshift(bkgCont);

    fs.writeFileSync(`${resourceFileRoot}/` + `${resName}Flyout.res`.toLocaleLowerCase(), stringifyBasicRes(menu));
}

const copyStaticResources = () => {
    fs.copySync(`${exportPath}/../template/cfg`, `${exportPath}/cfg`, { overwrite: false });
    fs.copySync(`${exportPath}/../template/materials`, `${exportPath}/materials`, { overwrite: false });
    fs.copyFileSync(`${exportPath}/../template/addoninfo.txt`, `${exportPath}/addoninfo.txt`);
};

const main = (): void => {
    cleanup();

    const config: ssConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, './config.json')).toString()) as ssConfig;
    const menuRes: mainMenuRes = parseMainMenuRes(fs.readFileSync(path.resolve(__dirname, './template/resource/ui/l4d360ui/mainmenu.res')).toString());

    createSplitScreenModeMenu(config, menuRes);

    //TODO: add in-game character switching (since unable to choose in custom menu)

    copyStaticResources();

    //TODO: auto-vpk
};

main();