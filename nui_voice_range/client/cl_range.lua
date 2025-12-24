local currentRange     = 8.0
local targetRange      = 8.0
local displayedRange   = 8.0
local displayedAlpha   = 0
local lastChangeTime   = 0
local isVisible        = false

 -- Wird überschrieben in config.lua etc blablabla
local showDuration = 3000
local fadeDuration  = 1000
local animTime      = 500
local color         = { r = 172, g = 72, b = 226, a = 170 }
local markerType    = 1
local markerHeight  = 0.2

Citizen.CreateThread(function()
    while not Config do Wait(100) end

    showDuration = Config.showDuration or 3000
    fadeDuration  = Config.fadeDuration  or 1000
    animTime      = Config.radiusAnimationTime or 500
    color         = Config.color or color
    markerType    = Config.markerType or 1
    markerHeight  = Config.markerHeight or 0.2

    while not LocalPlayer.state.proximity do Wait(50) end
    currentRange   = LocalPlayer.state.proximity.distance or 8.0
    targetRange    = currentRange
    displayedRange = currentRange
end)

-- React to voice range changes
AddEventHandler('pma-voice:setTalkingMode', function()
    local prox = LocalPlayer.state.proximity
    if prox and prox.distance and prox.distance ~= currentRange then
        currentRange   = prox.distance
        targetRange    = prox.distance
        lastChangeTime = GetGameTimer()
        isVisible      = true
    end
end)

-- Main drawing loop 
Citizen.CreateThread(function()
    while true do
        Wait(isVisible and 0 or 100)

        if isVisible then
            local now = GetGameTimer()
            local ped = PlayerPedId()
            local x, y, z = table.unpack(GetEntityCoords(ped))

            -- Smooth radius animation
            if math.abs(displayedRange - targetRange) > 0.05 then
                local diff = targetRange - displayedRange
                local step = diff * (GetFrameTime() * 1000 / animTime) * 20
                displayedRange = math.abs(step) < 0.05 and targetRange or displayedRange + step
            end

            -- Visibility + fade out
            local elapsed = now - lastChangeTime
            if elapsed < showDuration then
                displayedAlpha = color.a
            elseif elapsed < showDuration + fadeDuration then
                local fade = (elapsed - showDuration) / fadeDuration
                displayedAlpha = color.a * (1.0 - fade)
            else
                displayedAlpha = 0
                isVisible = false
            end

            -- Draw the marker
            if displayedAlpha > 10 and displayedRange > 0.1 then
                DrawMarker(
                    markerType,
                    x, y, z - 0.99,
                    0.0, 0.0, 0.0,
                    0.0, 0.0, 0.0,
                    displayedRange * 2, displayedRange * 2, markerHeight,
                    color.r, color.g, color.b, math.floor(displayedAlpha),
                    false, false, 2, false, nil, nil, false
                )
            end
        end
    end
end)