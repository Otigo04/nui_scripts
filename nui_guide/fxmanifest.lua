fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'NUI LABS'
description 'Premium Showcase Guide'
version '1.0.0'

-- UI Files
ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    -- 'html/assets/*.png', -- for images later
}

-- Scripts
shared_script 'config.lua'

client_scripts {
    'client/main.lua'
}

server_scripts {
    'server/main.lua'
}