fx_version 'cerulean'
game 'gta5'

author 'NUI LABS'
description 'High End Modular Speedometer System'
version '1.0.0'

-- UI Files
ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/jquery.js',
    'html/assets/*.png',
    'html/assets/*.svg'
}

-- Client Scripts
client_scripts {
    'config.lua',
    'client/utils.lua',
    'client/clientmain.lua'
    
}

-- Shared Scripts
shared_script 'config.lua'

lua54 'yes'