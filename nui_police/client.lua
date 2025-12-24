-- Main visibility state
local uiOpen = false

-- Function to toggle NUI visibility
-- This handles focus and cursor so the player can interact with the UI
local function toggleUI(status)
    uiOpen = status
    SetNuiFocus(status, status) -- Enables/Disables keyboard and mouse focus
    
    SendNUIMessage({
        action = "setVisible",
        status = status
    })
end

-- Command to open the dispatch
-- The command name is taken from our Config
RegisterCommand(Config.Command, function()
    -- Add job check here later
    toggleUI(not uiOpen)
end, false)

-- NUI Callback to close the UI
-- This is called from the JavaScript when pressing ESC
RegisterNUICallback('closeUI', function(data, cb)
    toggleUI(false)
    cb('ok')
end)