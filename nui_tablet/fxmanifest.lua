fx_version 'cerulean'
game 'gta5'

author 'NUI LABS'
description 'High End Modular Tablet System'
version '1.0.0'

-- UI Files
ui_page 'html/index.html'

-- Files to include
files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/img/*.png' -- Preparing for images later
}

-- Scripts
shared_script 'config.lua'
client_script 'client.lua'
server_script 'server.lua'

lua54 'yes'