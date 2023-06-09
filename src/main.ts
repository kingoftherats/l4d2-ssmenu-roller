import * as path from 'path';
import fs from 'fs-extra';
import process from 'process';
import { parseMainMenuRes, stringifyMainMenuRes, stringifyBasicRes, mainMenuRes, resContainer, basicRes } from './util/res';
import { ssConfig, ssConfigCampaign, ssMap } from './util/config';
import { resProperty } from './util/res';
import { Vpk } from 'node-vvpk';

const exportPath: string = path.join(__dirname, 'export');
const exportFilePath: string = path.join(__dirname, 'export.vpk');
const resourceFileRoot: string = path.join(exportPath, 'resource', 'ui', 'l4d360ui');

const resourceNameRoot: string = 'resource/UI/L4D360UI';

const ROW_HEIGHT: number = 21;
const WIDTH_PER_CHAR: number = 10;

const MAX_MENU_ROWS: number = 15;

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
        fs.rmSync(exportPath, { recursive: true, force: true });
    } catch { }
}

/**
 * Create the necessary directory structure for the export
 */
const createExportDirs = (): void => {
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
    let currMutationFlyout: basicRes = { name: `Resource/UI/${resName}Flyout.res`, containers: [] };

    //Support long mutation menus via "paging"
    let extraPageCount = 0;

    for (let i = 0; i < config.mutations.length; i++) {
        //Check to see if we've maxed out the rows for this menu
        if (currMutationFlyout.containers.length === MAX_MENU_ROWS) {
            //Add a "Prev..." entry if not the first page
            if (extraPageCount !== 0) {
                const prevPageIdx = currMutationFlyout.containers.length;
                const prevPageResName = `${resName}${extraPageCount > 1 ? 'Next' + (extraPageCount - 1) : ''}`;
                addMenuItem(mainMenu, currMutationFlyout, prevPageIdx, 'Prev...', prevPageResName);
            }

            //Add a "Next..." entry, commit this flyout and sub in the next one
            extraPageCount++;

            const nextPageIdx = MAX_MENU_ROWS;
            const nextPageResName = `${resName}Next${extraPageCount}`;
            addMenuItem(mainMenu, currMutationFlyout, nextPageIdx, 'Next...', nextPageResName);

            for(let j = 0; j < currMutationFlyout.containers.length; j++) {
                applyContainerNavProps(currMutationFlyout.containers[j], j, currMutationFlyout.containers.length);
            }

            //Background at end because of paging
            addMutationMenuBackground(config, currMutationFlyout);

            fs.writeFileSync(`${resourceFileRoot}/` + currMutationFlyout.name.replace('Resource/UI/', '').toLocaleLowerCase(), stringifyBasicRes(currMutationFlyout));

            currMutationFlyout = { name: `Resource/UI/${nextPageResName}Flyout.res`, containers: [] };
        }

        const mutationResName: string = `SplitMutation${config.mutations[i].id}`;
        addMenuItem(mainMenu, currMutationFlyout, (i % MAX_MENU_ROWS), config.mutations[i].name, mutationResName);

        createCampaignMenu(config, mutationResName, GameType.Mutation, config.mutations[i].id, mainMenu);
    }

    //Add a "Prev..." entry if not the first page
    if (extraPageCount !== 0) {
        const prevPageIdx = currMutationFlyout.containers.length;
        const prevPageResName = `${resName}${extraPageCount > 1 ? 'Next' + (extraPageCount - 1) : ''}`;
        addMenuItem(mainMenu, currMutationFlyout, prevPageIdx, 'Prev...', prevPageResName);
    }

    for(let j = 0; j < currMutationFlyout.containers.length; j++) {
        applyContainerNavProps(currMutationFlyout.containers[j], j, currMutationFlyout.containers.length);
    }

    //Background at end because of paging
    addMutationMenuBackground(config, currMutationFlyout);

    fs.writeFileSync(`${resourceFileRoot}/` + currMutationFlyout.name.replace('Resource/UI/', '').toLocaleLowerCase(), stringifyBasicRes(currMutationFlyout));
};

/**
 * Configure the background properties for a mutation menu flyout
 * @param config the split-screen config
 * @param mutationFlyout the target mutation flyout
 */
const addMutationMenuBackground = (config: ssConfig, mutationFlyout: basicRes): void => {
    const bkgCont: resContainer = getBackgroundContainer(mutationFlyout.containers.length,
        config.mutations.map(x => x.name).reduce((a, b) => a.length > b.length ? a : b).length);
    mutationFlyout.containers.unshift(bkgCont);
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
    let currCampaignflyout: basicRes = { name: `Resource/UI/${resName}Flyout.res`, containers: [] };

    //Some campaigns don't have map entries for certain game types so make sure to compensate for that
    let totalCampaignsUsed = 0;

    //Support long campaign menus via "paging"
    let extraPageCount = 0;

    for (let i = 0; i < config.campaigns.length; i++) {
        const campaign: ssConfigCampaign = config.campaigns[i];

        let campaignResName = '';
        const campaignNameNoSpaces: string = campaign.name.replace(/\s/g, '');
        switch(gameType) {
            case GameType.Campaign:
                campaignResName = `SplitCampaign${campaignNameNoSpaces}`;
                break;
            case GameType.Mutation:
                campaignResName = `Split${mutationId}${campaignNameNoSpaces}`;
                break;
            case GameType.Realism:
                campaignResName = `SplitRealism${campaignNameNoSpaces}`;
                break;
            case GameType.Survival:
                if (campaign.survival.length > 0)
                    campaignResName = `SplitSurvival${campaignNameNoSpaces}`;
                break;
            case GameType.Scavenge:
                if (campaign.scavenge.length > 0)
                    campaignResName = `SplitScavenge${campaignNameNoSpaces}`;
                break;
        }

        if (campaignResName.length > 0) {
            //Check to see if we've maxed out the rows for this menu
            if (currCampaignflyout.containers.length === MAX_MENU_ROWS) {
                //Add a "Prev..." entry if not the first page
                if (extraPageCount !== 0) {
                    const prevPageIdx = currCampaignflyout.containers.length;
                    const prevPageResName = `${resName}${extraPageCount > 1 ? 'Next' + (extraPageCount - 1) : ''}`;
                    addMenuItem(mainMenu, currCampaignflyout, prevPageIdx, 'Prev...', prevPageResName);
                }

                //Add a "Next..." entry, commit this flyout and sub in the next one
                extraPageCount++;

                const nextPageIdx = currCampaignflyout.containers.length;
                const nextPageResName = `${resName}Next${extraPageCount}`;
                addMenuItem(mainMenu, currCampaignflyout, nextPageIdx, 'Next...', nextPageResName);

                for(let j = 0; j < currCampaignflyout.containers.length; j++) {
                    applyContainerNavProps(currCampaignflyout.containers[j], j, currCampaignflyout.containers.length);
                }

                //Background at end because we may have "filtered" some N/A campaigns for the target game mode and paging
                addCampaignMenuBackground(config, currCampaignflyout);

                fs.writeFileSync(`${resourceFileRoot}/` + currCampaignflyout.name.replace('Resource/UI/', '').toLocaleLowerCase(), stringifyBasicRes(currCampaignflyout));

                currCampaignflyout = { name: `Resource/UI/${nextPageResName}Flyout.res`, containers: [] };
            }

            const itemIdx = totalCampaignsUsed % MAX_MENU_ROWS;
            addMenuItem(mainMenu, currCampaignflyout, itemIdx, campaign.name, campaignResName);

            createMapMenu(config, campaignResName, gameType as GameType, mutationId, campaign.name, mainMenu);

            totalCampaignsUsed++;
        }
    }

    //Add a "Prev..." entry if not the first page
    if (extraPageCount !== 0) {
        const prevPageIdx = currCampaignflyout.containers.length;
        const prevPageResName = `${resName}${extraPageCount > 1 ? 'Next' + (extraPageCount - 1) : ''}`;
        addMenuItem(mainMenu, currCampaignflyout, prevPageIdx, 'Prev...', prevPageResName);
    }

    for(let j = 0; j < currCampaignflyout.containers.length; j++) {
        applyContainerNavProps(currCampaignflyout.containers[j], j, currCampaignflyout.containers.length);
    }

    //Background at end because we may have "filtered" some N/A campaigns for the target game mode and paging
    addCampaignMenuBackground(config, currCampaignflyout);

    fs.writeFileSync(`${resourceFileRoot}/` + currCampaignflyout.name.replace('Resource/UI/', '').toLocaleLowerCase(), stringifyBasicRes(currCampaignflyout));
};

/**
 * Add an item to a menu flyout
 * @param mainMenu the main menu resource
 * @param menuFlyout the target menu flyout
 * @param itemIdx the item index within the menu
 * @param labelText the item label text
 * @param itemResName the item resource name
 */
const addMenuItem = (mainMenu: mainMenuRes, menuFlyout: basicRes, itemIdx: number, labelText: string, itemResName: string): void => {
    const btnCont: resContainer = {
        name: `Btn${itemIdx}`,
        properties: [
            ...BTN_PROPS_TEMPLATE,
            { name: 'fieldName', value: `"Btn${itemIdx}"` },
            { name: 'labelText', value: `"${labelText}"` },
            { name: 'ypos', value: `"${itemIdx * ROW_HEIGHT}"` },
            { name: 'wide', value: `"${labelText.length * WIDTH_PER_CHAR}"` }
        ]
    };

    mainMenu.containers.push(getMainMenuCommandContainer(itemResName));
    mainMenu.gameModesSplit.modes.push(getMainMenuModeContainer(itemResName));

    btnCont.properties.push({ name: 'command', value: `"Flm${itemResName}Flyout"` });
    menuFlyout.containers.push(btnCont);
};

/**
 * Configure the background properties for a campaign menu flyout
 * @param config the split-screen config
 * @param campaignFlyout the target campaign flyout
 */
const addCampaignMenuBackground = (config: ssConfig, campaignFlyout: basicRes): void => {
    const bkgCont: resContainer = getBackgroundContainer(campaignFlyout.containers.length,
        config.campaigns.map(x => x.name).reduce((a, b) => a.length > b.length ? a : b).length);
    campaignFlyout.containers.unshift(bkgCont);
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
            createDifficultyMenu(config, mapResName, gameType as GameType, mutationId, maps[i].id);
        }
        else {
            cont.properties.push({ name: 'command', value: `"#sv_cheats 1;sv_pausable 1;map ${maps[i].id} ${mode};wait 100;connect_splitscreen localhost 2;cmd2 name ${config.player2Name}"` });
        }

        flyout.containers.push(cont);
    }

    fs.writeFileSync(`${resourceFileRoot}/` + `${resName}Flyout.res`.toLocaleLowerCase(), stringifyBasicRes(flyout));
}

/**
 * Create the difficulty menu flyout and link to the main menu. Generates start commands for campaign type games.
 * @param config the split-screen config
 * @param resName the name of the resource to be created
 * @param gameType the game type (campaign, mutation, scavenge, etc.)
 * @param mutationId the mutation id or null if N/A
 * @param mapId the map id
 */
const createDifficultyMenu = (config: ssConfig, resName: string, gameType: GameType, mutationId: string | null, mapId: string): void => {
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

        cont.properties.push({ name: 'command', value: `"#sv_cheats 1;sv_pausable 1;map ${mapId} ${mode};z_difficulty ${difficulty};wait 100;connect_splitscreen localhost 2;cmd2 name ${config.player2Name}"` });
        menu.containers.push(cont);
        i++;
    }

    const bkgCont: resContainer = getBackgroundContainer(Object.keys(Difficulty).length,
        Object.keys(Difficulty).reduce((a, b) => a.length > b.length ? a : b).length);
    menu.containers.unshift(bkgCont);

    fs.writeFileSync(`${resourceFileRoot}/` + `${resName}Flyout.res`.toLocaleLowerCase(), stringifyBasicRes(menu));
}

const copyStaticResources = () => {
    fs.copySync(path.join(exportPath, '..', 'template', 'materials'), path.join(exportPath, 'materials'), { overwrite: false });
    fs.copyFileSync(path.join(exportPath, '..', 'template', 'addoninfo.txt'), path.join(exportPath, 'addoninfo.txt'));

    fs.copyFileSync(path.join(exportPath, '..', 'template', 'resource', 'ui', 'l4d360ui', 'ingamemainmenu.res'), path.join(exportPath, 'resource', 'ui', 'l4d360ui', 'ingamemainmenu.res'));
    fs.copyFileSync(path.join(exportPath, '..', 'template', 'resource', 'ui', 'l4d360ui', 'setsurvivorp1flyout.res'), path.join(exportPath, 'resource', 'ui', 'l4d360ui', 'setsurvivorp1flyout.res'));
    fs.copyFileSync(path.join(exportPath, '..', 'template', 'resource', 'ui', 'l4d360ui', 'setsurvivorp2flyout.res'), path.join(exportPath, 'resource', 'ui', 'l4d360ui', 'setsurvivorp2flyout.res'));
};

const main = (): void => {
    cleanup();
    createExportDirs();

    const config: ssConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')).toString()) as ssConfig;
    const menuRes: mainMenuRes = parseMainMenuRes(fs.readFileSync(path.join(__dirname, 'template', 'resource', 'ui', 'l4d360ui', 'mainmenu.res')).toString());

    createSplitScreenModeMenu(config, menuRes);
    
    copyStaticResources();

    if (config.exportToVpk) {
        const args: string[] = process.argv;

        const vpk: Vpk = Vpk.fromDirectory(exportPath);
        
        vpk.setVersion(1);
        if (args.length > 2)
            vpk.saveToFile(exportFilePath, false, args[2]);
        else
            vpk.saveToFile(exportFilePath, false, 'utf-8');
        cleanup();
    }
};

main();