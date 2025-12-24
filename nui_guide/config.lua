Config = {}

-- General Settings
Config.OpenCommand = 'guide' -- Command to open the guide
Config.OpenKey = 'F9' -- Default Keybind
Config.Language = 'en' -- Default Language (Features planned for later)

-- UI Settings
Config.Colors = {
    primary = '#3498db', -- Accent color
    background = 'rgba(20, 20, 20, 0.95)', -- Dark glass effect
    text = '#ffffff'
}

-- Content Data
-- The customer creates the structure here.
Config.Categories = {
    {
        id = 'mail_script',
        label = 'NUI Mail',
        icon = 'fa-solid fa-envelope', -- FontAwesome Icon class
        subcategories = {
            {
                title = 'Getting Started',
                content = [[
                    <h1>Welcome to NUI Mail</h1>
                    <p>This is the most advanced mail script on the market.</p>
                    <p>Press <strong>F1</strong> to open your inbox.</p>
                ]]
            },
            {
                title = 'Hotkeys',
                content = [[
                    <ul>
                        <li><strong>E</strong> - Read Mail</li>
                        <li><strong>DEL</strong> - Delete Mail</li>
                    </ul>
                ]]
            }
        }
    },
    {
        id = 'adminmenu',
        label = 'Advanced Admin Menu',
        icon = 'fa-solid fa-box-open',
        subcategories = {
            {
                title = 'About NUI LABS Admin Menu',
                content = [[
                    <h1>About</h1>
                    <p>Huge Admin Menu with clean UI and ton of functionality!</p>
                ]]
            },
            {
                title = 'Hotkeys',
                content = [[
                    <h1>Hotkeys</h1>
                    <ul>
                        <li><strong>F6</strong> - open Menu</li>
                        <li><strong>ARROWS</strong> - navigate</li>
                        <li><strong>ENTER</strong> - press</li>
                    </ul>
                ]]
            },
        }
    },
    {
            id = 'nuinotify',
            label = 'NUI NOTIFY',
            icon = 'fa-solid fa-shield-halved',
            subcategories = {
                {
                    title = 'Funktionen',
                    content = [[
                        <h1>Wähle aus 10 Themes!</h1>
                        <p>BLA BLA BLA.</p>
                    ]]
                }
            }
    },
}