-- 1. Registered companies on the stock market
CREATE TABLE IF NOT EXISTS `nui_stock_companies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_name` varchar(50) NOT NULL, -- Link to job system (e.g. 'police', 'cardealer')
  `label` varchar(50) NOT NULL, -- Display name (e.g. "Los Santos PD")
  `owner_citizenid` varchar(50) DEFAULT NULL, -- Who listed this company?
  `total_shares` int(11) NOT NULL DEFAULT 1000, -- Total shares in existence
  `shares_available` int(11) NOT NULL DEFAULT 1000, -- Shares still available for purchase
  `current_price` decimal(20,2) NOT NULL DEFAULT 10.00, -- Current stock price
  `previous_price` decimal(20,2) NOT NULL DEFAULT 10.00, -- Price before last update (for % change)
  `balance` decimal(20,2) NOT NULL DEFAULT 0.00, -- Company bank balance (Important for calculation!)
  `created_at` timestamp DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_name` (`job_name`)
);

-- 2. Player Portfolios (Who owns what?)
CREATE TABLE IF NOT EXISTS `nui_stock_portfolio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `citizenid` varchar(50) NOT NULL,
  `company_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL DEFAULT 0, -- Number of shares owned
  `avg_buy_price` decimal(20,2) NOT NULL DEFAULT 0.00, -- Average buy price (to calculate profit/loss)
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_stock` (`citizenid`, `company_id`)
);

-- 3. Historical data for charts (Saved every X minutes)
CREATE TABLE IF NOT EXISTS `nui_stock_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `price` decimal(20,2) NOT NULL,
  `timestamp` timestamp DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_history` (`company_id`)
);

-- 4. Transaction Log (For security and "News")
CREATE TABLE IF NOT EXISTS `nui_stock_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `citizenid` varchar(50) NOT NULL,
  `company_id` int(11) NOT NULL,
  `type` enum('buy','sell','ipo') NOT NULL,
  `amount` int(11) NOT NULL,
  `price_per_share` decimal(20,2) NOT NULL,
  `timestamp` timestamp DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `nui_stock_accounts` (
  `citizenid` varchar(50) NOT NULL,
  `balance` decimal(20,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`citizenid`)
);