-- ==============================================================================
--                               NUI LABS - UTILS
-- ==============================================================================
-- This file handles external exports and framework bridges.
-- It keeps the main loop clean.

function GetFuel(vehicle)
    local system = Config.FuelSystem
    
    -- 1. LegacyFuel (The classic ESX standard)
    if system == 'legacyfuel' then
        -- Check if the export actually exists to prevent errors
        if GetResourceState('LegacyFuel') == 'started' then
            return exports['LegacyFuel']:GetFuel(vehicle)
        else
            -- Fallback if config is wrong but script missing
            return GetVehicleFuelLevel(vehicle)
        end

    -- 2. Ox Fuel (Modern standard)
    elseif system == 'ox_fuel' then
        -- ox_fuel usually syncs with native GetVehicleFuelLevel or Entity State
        -- But strict implementation might look like this:
        if GetResourceState('ox_fuel') == 'started' then
             return GetVehicleFuelLevel(vehicle) 
             -- Note: ox_fuel syncs native values efficiently.
        end
        return GetVehicleFuelLevel(vehicle)

    -- 3. CDN Fuel (Popular QBCore fork)
    elseif system == 'cdn-fuel' then
        if GetResourceState('cdn-fuel') == 'started' then
            return exports['cdn-fuel']:GetFuel(vehicle)
        end
        return GetVehicleFuelLevel(vehicle)

    -- 4. Default / Standalone (GTA V Native)
    else
        return GetVehicleFuelLevel(vehicle)
    end
end