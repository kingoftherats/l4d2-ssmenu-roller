# l4d2-ssmenu-roller
Roll your own Left 4 Dead 2 (PC) split-screen game menu (based on the mod by SKFTeam at https://gamebanana.com/mods/27912)

This tool lets you add your own custom split-screen game menu to include additional mutations, menu mods and maps that you may have added to the base game.

## Dependencies:

- Node.js (any currently supported version should be fine)

## Building:

npm run build

## Usage:

- modify config.json to include desired maps and mutations (base maps and mutations already included in the given template), and whether to export files or a (ready to deploy) VPK file as output
- if building upon custom menu mods, copy your target mainmenu.res to template/resource/ui/l4d360ui/ alongside main.js
- run main.js with Node.js:

```sh
node main.js
```

- if exporting automatically to a VPK file then you may specify an optional path encoding ([Supported Encodings](https://nodejs.org/api/buffer.html#buffers-and-character-encodings) -- defaulted to 'utf-8'):

```sh
node main.js latin1
```

- if not automatically exporting to a VPK file:
    - convert the exported files (the generated "export" folder) to a VPK file (using a VPK packaging tool such as [node-vvpk-cli](https://github.com/kingoftherats/node-vvpk-cli))
        - remember that Left 4 Dead 2 uses VPK v1 so set the target version appropriately
- copy the resulting VPK to the Left 4 Dead 2 addons folder
- you'll find the new split-screen game mode at the end of the base game modes in the main menu

## Notes:

- Unlike the mod that this tool is based on, a controller config is not included. I have had success in playing with 2 controllers while using the default "Steam Input" config that Steam recommends. The base speeds for horizontal and vertical looking will likely need to be tuned to your preferences within the in-game options. You may also need to remap a couple of buttons to your liking through the Steam Input settings.