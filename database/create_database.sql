CREATE DATABASE showrunner;
USE showrunner;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `shows` (
    `location` VARCHAR(255) NOT NULL,
    `show` VARCHAR(255) NOT NULL
    CONSTRAINT PK_Services PRIMARY KEY (`location`,`show`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `templates` (
    `id` VARCHAR(255) NOT NULL,
    `data` BLOB NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `runsheets` (
    `id` VARCHAR(255) NOT NULL,
    `template` VARCHAR (255) NOT NULL,
    `location` VARCHAR (255) NOT NULL,
    `show` VARCHAR (255) NOT NULL,
    `from` DATE NOT NULL,
    `to` DATE NOT NULL,
    `title` VARCHAR (255) NOT NULL,
    `subtitle` VARCHAR (255),
    `data` BLOB NOT NULL,
    `dirty` BOOLEAN DEFAULT FALSE,
    `expires` DATETIME,
    `cache` BLOB,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`template`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;