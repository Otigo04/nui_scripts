fx_version 'cerulean'
game 'gta5'

author 'NUI LABS'
description 'Advanced Notification System with High-End UI'
version '1.0.0'

-- We use Lua 5.4 for better performance
lua54 'yes'

-- The configuration file (shared)
shared_script 'config.lua'

-- Client side scripts
client_script 'client/main.lua'

-- UI Files (Everything the browser needs to see)
ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/sounds/notify.ogg'
}