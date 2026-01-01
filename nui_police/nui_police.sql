CREATE TABLE IF NOT EXISTS `police_directives` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `author_name` VARCHAR(255) NOT NULL,
    `author_rank` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `police_settings` (
    `setting_key` VARCHAR(50) PRIMARY KEY,
    `setting_value` TEXT NOT NULL
);

-- Standard Gefahrenstufe setzen
INSERT IGNORE INTO `police_settings` (`setting_key`, `setting_value`) VALUES ('hazard_level', '1');