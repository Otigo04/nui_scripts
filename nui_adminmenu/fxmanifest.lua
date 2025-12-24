fx_version 'cerulean'
game 'gta5'

description 'NUI LABS Admin Menu'
version 'V0.92'

-- WICHTIG: Die Config muss VOR den Scripts geladen werden!
shared_script 'config.lua'

client_scripts {
    'client/clientmain.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua', -- Falls du MySQL nutzt
    'server/servermain.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/menuData.js',
    'html/sounds/*.mp3',
    '*.png',
    '*.jpg'
}