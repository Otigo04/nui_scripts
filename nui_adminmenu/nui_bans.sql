CREATE TABLE IF NOT EXISTS `nui_bans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ban_id` varchar(50) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `license` varchar(50) DEFAULT NULL,
  `discord` varchar(50) DEFAULT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `xbox` varchar(50) DEFAULT NULL,
  `liveid` varchar(50) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `banned_by` varchar(50) DEFAULT NULL,
  `ban_date` int(11) DEFAULT NULL,
  `expire_date` int(11) DEFAULT NULL, -- NULL oder 0 = Permanent
  `active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `license` (`license`),
  KEY `discord` (`discord`),
  KEY `ip` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;