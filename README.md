# TF2 - Discord Rich Presence

Display TF2 information as rich presence in discord.

[Small preview](https://i.imgur.com/hbXTsa4.png)

# Features
- [Automatically detects if the hl2.exe process is running (with "-game tf" parameter) or not in order to activate/deactivate the Rich Presence](#pm2--autostart)
- 100% VAC Secure. Uses config files and "con_logfile" (dump console log in a file) to recieve game data
- [All official maps currently available supported](https://wiki.teamfortress.com/wiki/List_of_maps)
- Display length of your play session
- Display the class you are currently playing
- Display the map you are currently playing on
- No need to setup an application, you can just use the one I created
- If you use your own application it will automatically fetch all available assets from the Discord API. Making it super easy to use your own application
- For suggestions add me on Discord **Felix#2343**, I am most active there

# Installation / How to use

**Windows Instructions:**

1. Install [NodeJS](https://nodejs.org/en/)
2. Clone this repository into a folder
3. Open a command prompt inside the folder and enter `npm install`
4. Move `autoexec.cfg` into your `<Steam>\steamapps\common\Team Fortress 2\tf\cfg` folder and restart tf2, if opened (**NOTE:** If you already have a `autoexec.cfg` just add `con_logfile "discordrichpresence.log"` to the end of it)
5. Go back to the command prompt we opened earlier and enter `node index` to start the process (**This step is obsolete if you use the [Autostart feature](#pm2--autostart)**)

**Start the process and leave it running!** When you close it the rich presence will disappear.

**IMPORTANT NOTE:**

**This WILL modify your configs if you leave it to the default settings.**

In order to make this whole thing work it creates a config file for every single class and every single map on startup.

If a config already exists it appends the stuff needed.

- If you don't want it to modify your existing configs set `appendExisting` in the config.json to `false`.

- If you don't want it to create/modify configs at all set `generateConfigs` in the config.json to `false`. *(Then basically the entire thing wont work unless this was set to `true` at least once)*

# PM2 / Autostart

**Instructions:**

1. Open a command prompt inside the folder from [Installation / How to use](#installation--how-to-use)
2. Install pm2 with `npm install pm2@latest -g`
3. Install [pm2-windows-startup](https://github.com/marklagendijk/node-pm2-windows-startup) with `npm install pm2-windows-startup -g`
4. Enter `pm2-startup install` to set up the autostart
5. Enter `pm2 start index.js --name "TF2 RichPresence"`
6. Enter `pm2 save`
7. Everytime windows starts up the process will run in the background and automatically display when needed.

[In the end the output in your command prompt should look something like this](https://i.imgur.com/deklmHy.png)

# Some notes for running it
- It will automatically start the rich presence when you start TF2
- It will automatically close the rich presence when you close TF2

# How to use your own Discord application with custom images
1. Create an application [on Discord](https://discordapp.com/developers/applications/me)
2. Go to `Rich Presence` > `Art Assets` and upload all images you want.
3. Replace the client ID from the `config.json` with the one you have in `General Information` on the website

**Notes:**
- Maps are called exactly what they are called ingame. `pl_badwater` ingame is `pl_badwater` in the assets list.
- The `menu` asset is used when the client is in the main menu
- The `default` asset is used on maps which dont have a image by default in our application
- `demoman`, `engineer`, `heavy`, `medic`, `pyro`, `scout`, `sniper`, `soldier` & `spy` are used for the different classes
- The `assets` folder are the images I use in my application. They are taken from the [TF2 Wiki](https://wiki.teamfortress.com/)

It should look similar to [this](https://i.imgur.com/lDiwucR.png)
