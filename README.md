# l4d2-ssmenu-roller
Roll your own Left 4 Dead 2 (PC) split-screen game menu (based on the mod by SKFTeam at https://gamebanana.com/mods/27912)

This tool lets you add your own custom split-screen game menu to include additional mutations, menu mods and maps that you may have added to the base game.

Dependencies:

- Node.js
- Python and https://github.com/ValvePython/vpk (or another VPK tool)

Building:

npm run build

Usage:

- modify config.json to include desired maps and mutations (base maps and mutations already included)
- if building upon custom menu mods, copy your target mainmenu.res to template/resource/ui/l4d360ui/ alongside main.js
- run "node main.js"
- convert the exported resources (the generated "export" folder) to a VPK (using this tool https://github.com/ValvePython/vpk)
    - remember that Left 4 Dead 2 uses VPK v1 so use the "-cv" flag: vpk -cv 1 -c ./export ssm.vpk
- copy the resulting VPK to the Left 4 Dead 2 addons folder
- you'll find the new split-screen game mode at the end of the base game modes in the main menu

Notes:

- Unlike the mod that this tool is based on, a controller config is not included. I have had success in playing with 2 controllers while using the default "Steam Input" config that Steam recommends. The base speeds for horizontal and vertical looking will likely need to be tuned to your preferences within the in-game options. You may also need to remap a couple buttons to your liking through the Steam Input settings.