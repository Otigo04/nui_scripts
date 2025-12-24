fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'NUI Labs'
description 'Premium Mail System'
version '1.1.0' 

ui_page 'html/index.html'

-- CONFIGURATION (Loads config.lua correctly)
shared_scripts {
    'config.lua' 
}

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/sounds/click.mp3',
    'html/sounds/*.mp3'
}

client_scripts {
    'client.lua'
}
server_scripts {
    'server.lua'
}

dependencies {
    'qb-core',
    'oxmysql'
}