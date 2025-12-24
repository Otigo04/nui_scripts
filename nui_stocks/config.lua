Config = {}

-- Debug Mode
Config.Debug = true 

-- TIME SETTINGS
-- How often should the prices update? (Seconds)
-- RECOMMENDED: 900 (15 Minutes) or 1800 (30 Minutes) for realistic servers.
-- TESTING: 5 (Only for debugging!)
Config.UpdateInterval = 5 

-- ECONOMY LIMITS
Config.Limits = {
    MinPrice = 1.00,        -- Floor price
    MaxPrice = 2950.00,     -- Ceiling price
    MaxChange = 0.15        -- Hard limit: Price cannot move more than 15% in a single tick
}

-- MATHEMATICAL TUNING (THE "BRAIN")
Config.Math = {
    -- Global Multiplier: Scales ALL movement.
    -- 1.0 = Normal, 0.5 = Half speed, 0.1 = Very Slow (Good for 5sec updates)
    -- Reduce this if prices move too fast!
    GlobalVolatility = 0.1, 

    -- Trend Impact: How much does "Bull" or "Bear" market affect prices?
    -- 0.02 = 2% Bonus/Malus per tick
    GlobalTrendStrength = 0.02,

    -- Price Damping: Prevents stocks from staying at MaxPrice forever.
    -- If Price > 2000, we apply negative pressure to push it down naturally.
    SoftCapStart = 2000.00,
    SoftCapResistance = 0.05 -- 5% extra drag downwards if above SoftCap
}

-- BROKER SETTINGS
Config.Broker = {
    WithdrawTax = 0.15, -- 15% Tax
    MinDeposit = 100,   
}

-- STOCK CATEGORIES (SECTORS)
-- 'volatility': Multiplier for price swings. (High = Crypto-like, Low = Stable)
-- 'trendBias': Natural drift. 
--    0.00 = Neutral
--    0.02 = Strong Uptrend (2% per tick) -> CAREFUL WITH THIS!
--   -0.01 = Slow Downtrend
Config.Categories = {
    ['tech'] = { 
        label = 'Technology', 
        icon = 'fas fa-microchip', 
        volatility = 1.5, 
        trendBias = 0.005 -- Reduced from 0.05 to prevent explosion
    },
    ['auto'] = { 
        label = 'Automotive', 
        icon = 'fas fa-car', 
        volatility = 0.8, 
        trendBias = 0.0 
    },
    ['finance'] = { 
        label = 'Finance & Crypto', 
        icon = 'fas fa-coins', 
        volatility = 2.0, -- High risk
        trendBias = 0.0 
    },
    ['gov'] = { 
        label = 'Government', 
        icon = 'fas fa-university', 
        volatility = 0.2, -- Very stable
        trendBias = 0.001 -- Tiny consistent growth
    },
    ['food'] = { 
        label = 'Food & Services', 
        icon = 'fas fa-utensils', 
        volatility = 0.6, 
        trendBias = 0.0 
    },
    ['industrial'] = { 
        label = 'Industrial', 
        icon = 'fas fa-industry', 
        volatility = 0.8, 
        trendBias = -0.002 
    },
    ['transport'] = { 
        label = 'Transportation', 
        icon = 'fas fa-bus', 
        volatility = 0.5, 
        trendBias = 0.0 
    },
}

-- GLOBAL MARKET TREND
Config.MarketTrend = {
    ChanceToSwitch = 0.05, -- 5% Chance per tick to change global mood
}