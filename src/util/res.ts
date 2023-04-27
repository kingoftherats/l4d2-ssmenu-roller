/**
 * Parses a main menu resource from a data string and returns an object
 * @param strResText the main menu resource text
 * @returns a main menu resource object
 */
export const parseMainMenuRes = (strResText: string): mainMenuRes => {
    const root: mainMenuRes = {
        name: 'Resource/UI/MainMenu.res',
        mainMenu: { name: 'MainMenu', properties: []},
        gameModes: { name: 'BtnGameModes', properties: [], modes: []},
        gameModesSplit: { name: 'BtnGameModesSplit', properties: [], modes: []},
        containers: []
    };

    const resLines: string[] = strResText.split(/\r?\n/);
    
    let containerPending: string | null = null;
    const containerNesting: string[] = [];

    //Track these special resources more closely
    let inRoot: boolean = false;
    let inMainMenu: boolean = false;
    let inGameModes: boolean = false;

    let currentGameMode: resContainer | null = null;
    let currentContainer: resContainer | null = null;

    for (let lineNum = 0; lineNum < resLines.length; lineNum++) {
        const trimmed = resLines[lineNum].trim();

        if (trimmed.length === 0) continue; //discard blank lines
        if (trimmed.startsWith('//')) continue; //discard commented lines -- maybe we can restore these later

        const lineParts: string[] = parseLineChunks(lineNum, trimmed);

        //Containers can have optional conditions
        if (lineParts.length === 1 || (lineParts.length === 2 && lineParts[1].startsWith('['))) {
            if (lineParts[0] === '{') {
                if (containerPending !== null) {
                    containerNesting.push(containerPending);
                    containerPending = null;
                } else {
                    throw getLineError(lineNum, 'Open brace found with no container pending.');
                }
            } else if (containerPending) {
                throw getLineError(lineNum, `Container ${containerPending} pending but missing opening brace.`);
            } else if (lineParts[0] === '}') {
                if (containerNesting.length > 0) {
                    containerNesting.pop();

                    if (inMainMenu) {
                        inMainMenu = false;
                    } else if (inGameModes) {
                        if (currentGameMode === null) {
                            inGameModes = false;
                        } else {
                            root.gameModes.modes.push(currentGameMode);
                            currentGameMode = null;
                        }
                    } else {
                        root.containers.push(currentContainer as resContainer);
                    }
                } else {
                    throw getLineError(lineNum, 'No open container to close.');
                }
            } else {
                containerPending = lineParts[0];

                if (containerPending === '"' + root.name + '"') {
                    inRoot = true; //needed?
                } else if (containerPending === '"' + root.mainMenu.name + '"') {
                    inMainMenu = true;  //needed?
                } else if (containerPending === '"' + root.gameModes.name + '"') {
                    inGameModes = true;
                } else if (inGameModes) {
                    if (lineParts.length === 2) {
                        currentGameMode = { name: 'mode', properties: [], condition: lineParts[1] };
                    } else {
                        currentGameMode = { name: 'mode', properties: [] };
                    }
                } else {
                    if (lineParts.length === 2) {
                        currentContainer = { name: lineParts[0].replace(/"/g, ''), properties: [], condition: lineParts[1] };
                    } else {
                        currentContainer = { name: lineParts[0].replace(/"/g, ''), properties: [] };
                    }
                }
            }
        } else {
            if (lineParts.length === 2) {
                if (inMainMenu) {
                    root.mainMenu.properties.push({ name: lineParts[0].replace(/"/g, ''), value: lineParts[1] });
                } else if (inGameModes && currentGameMode === null) {
                    root.gameModes.properties.push({ name: lineParts[0].replace(/"/g, ''), value: lineParts[1] });
                } else if (currentGameMode !== null) {
                    currentGameMode.properties.push({ name: lineParts[0].replace(/"/g, ''), value: lineParts[1]});
                } else {
                    (currentContainer as resContainer).properties.push({ name: lineParts[0].replace(/"/g, ''), value: lineParts[1] });
                }
            } else if (lineParts.length === 3) {
                if (inMainMenu) {
                    root.mainMenu.properties.push({ name: lineParts[0].replace(/"/g, ''), value: lineParts[1], condition: lineParts[2] });
                } else if (inGameModes && currentGameMode === null) {
                    root.gameModes.properties.push({ name: lineParts[0].replace(/"/g, ''), value: lineParts[1], condition: lineParts[2] });
                } else if (currentGameMode !== null) {
                    currentGameMode.properties.push({ name: lineParts[0].replace(/"/g, ''), value: lineParts[1], condition: lineParts[2] });
                } else {
                    (currentContainer as resContainer).properties.push({ name: lineParts[0].replace(/"/g, ''), value: lineParts[1], condition: lineParts[2] });
                }
            } else {
                throw getLineError(lineNum, `Invalid property line: ${trimmed}`);
            }
        }
    }

    return root;
};

/**
 * Serializes a main menu resource object to a .res-formatted string
 * @param menuRes the main menu resource object 
 * @returns a .res-formatted string
 */
export const stringifyMainMenuRes = (menuRes: mainMenuRes): string => {
    let outStr = '';

    //MainMenu section
    outStr += `"${menuRes.name}"\r\n{\r\n\t"${menuRes.mainMenu.name}"\r\n\t{`;
    menuRes.mainMenu.properties.forEach(prop => {
        outStr += `\r\n\t\t"${prop.name}"\t${prop.value}` + (prop.condition ? `\t${prop.condition}` : '');
    });
    outStr += '\r\n\t}\r\n\r\n';

    //Game Modes sections
    outStr += stringifyGameModes(menuRes.gameModes);
    outStr += stringifyGameModes(menuRes.gameModesSplit);

    //All other containers
    menuRes.containers.forEach(cont => {
        outStr += stringifyResContainer(cont, 1);
        outStr += '\r\n\r\n';
    });

    outStr += '}\r\n';
    return outStr;
};

/**
 * Serializes a game modes container to a .res-formatted string
 * @param gameModes the game modes container
 * @returns a .res-formatted string
 */
const stringifyGameModes = (gameModes: gameModesContainer): string => {
    let outStr = `\t"${gameModes.name}"\r\n\t{`;
    gameModes.properties.forEach(prop => {
        outStr += `\r\n\t\t"${prop.name}"\t${prop.value}` + (prop.condition ? `\t${prop.condition}` : '');
    });
    gameModes.modes.forEach(mode => {
        outStr += `\r\n\r\n\t\t${mode.name}` + (mode.condition ? `\t${mode.condition}` : '') + '\r\n\t\t{';
        mode.properties.forEach(prop => {
            outStr += `\r\n\t\t\t"${prop.name}"\t${prop.value}` + (prop.condition ? `\t${prop.condition}` : '');
        });
        outStr += '\r\n\t\t}';    
    });
    outStr += '\r\n\t}\r\n\r\n';
    return outStr;
};

/**
 * Serializes a basic resource object to a .res-formatted string
 * @param basic the basic resource object 
 * @returns a .res-formatted string
 */
export const stringifyBasicRes = (basic: basicRes): string => {
    let outStr = '';
    outStr += `"${basic.name}"\r\n{\r\n`;
    basic.containers.forEach(cont => {
        outStr += stringifyResContainer(cont, 1);
        outStr += '\r\n\r\n';
    });

    outStr += '}\r\n';
    return outStr;
};

/**
 * 
 * @param cont Serialized a resource container to a .res-formatted string
 * @param indentLevel the indentation-level of the container within the target parent resource
 * @returns a .res-formatted string
 */
const stringifyResContainer = (cont: resContainer, indentLevel: number): string => {
    let outStr = '';
    outStr += `${'\t'.repeat(indentLevel)}"${cont.name}"\r\n${'\t'.repeat(indentLevel)}{`;
    cont.properties.forEach(prop => {
        outStr += `\r\n${'\t'.repeat(indentLevel+1)}"${prop.name}"\t${prop.value}` + (prop.condition ? `\t${prop.condition}` : '');
    });
    outStr += `\r\n${'\t'.repeat(indentLevel)}}`;
    return outStr;
}

/**
 * Returns an error with a formatted message
 * @param lineNum the line number on which the error occurs
 * @param message the error message
 * @returns an error
 */
const getLineError = (lineNum: number, message: string): Error => {
    return new Error(`Line ${lineNum+1}: ${message}`);
}

/**
 * Parses a .res-formatted line into the various chunks/tokens that a line may have
 * @param lineNum the line number
 * @param line the line text
 * @returns an array of line chunks/tokens
 */
const parseLineChunks = (lineNum: number, line: string): string[] => {
    const lineParts: string[] = [];

    let currChunk: string[] = [];

    let openQuote = false;
    let openBrace = false;
    let openNumber = false;

    for (let i = 0; i < line.length; i++) {
        const currChar = line.charAt(i);
        if (currChar === '/' && !openBrace && !openQuote) {
            if (line.length > (i + 1) && line.charAt(i + 1) === '/') {
                break; //we've reached a comment that consumes the rest of the line
            }
            throw getLineError(lineNum, 'Orphaned slash found. (Was this intended to be a comment?)');
        } else if (currChar.match(/\s/)) {
            if (openNumber) {
                openNumber = false;
                lineParts.push(currChunk.join('')); //commit current quoted value
                currChunk = [];
            } else if (!openQuote || !openBrace) {
                continue; //discard non-value whitespace
            }
        } else if (!openQuote && (currChar === '{' || currChar === '}')) {
            if (i !== 0) {
                throw getLineError(lineNum, 'Curly braces must be on their own line.')
            }
            lineParts.push(currChar);
            return lineParts;
        } else if (currChar === '"') {
            if (openQuote) {
                openQuote = false;
                currChunk.push(currChar);
                lineParts.push(currChunk.join('')); //commit current quoted value
                currChunk = [];
            } else {
                openQuote = true;
                currChunk.push(currChar);
            }
        } else if (currChar === '[') {
            if (openBrace) {
                throw getLineError(lineNum, 'Nested condition braces not allowed.')
            }

            openBrace = true;
            currChunk.push(currChar);
        } else if (currChar === ']') {
            if (!openBrace) {
                throw getLineError(lineNum, 'Condition closing brace without opening brace.')
            }

            openBrace = false;
            currChunk.push(currChar);
            lineParts.push(currChunk.join('')); //commit current condition
            currChunk = [];
        } else {
            if (!openQuote && !openBrace && !openNumber) {
                //some numeric values are quoted and some aren't
                if ((currChar === '-' || currChar.match(/\d/))) {
                    if (lineParts.length !== 1) {
                        throw getLineError(lineNum, 'Non-quoted numerical values may only be used as property values.')    
                    }
                    openNumber = true;
                } else {
                    throw getLineError(lineNum, 'Value or condition content found outside of braces.')
                }
            }

            currChunk.push(currChar);
        }
    }

    if (openNumber) {
        lineParts.push(currChunk.join('')); //ensure we commit any un-quoted numbers at the end of a line
    }

    return lineParts;
}

export interface basicRes {
    name: string;
    containers: resContainer[];
}

export interface mainMenuRes extends basicRes {
    mainMenu: resContainer;
    gameModes: gameModesContainer;
    gameModesSplit: gameModesContainer;
}

export interface resContainer {
    name: string;
    condition?: string;
    properties: resProperty[];
}

export interface gameModesContainer {
    name: string;
    properties: resProperty[];
    modes: resContainer[];
}

export interface resProperty {
    name: string;
    value: any;
    condition?: string;
}