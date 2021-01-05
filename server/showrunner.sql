CREATE DATABASE showrunner;
USE showrunner;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `Runsheets` (
    `Campus` varchar(255) NOT NULL,
    `Service` varchar(255) NOT NULL,
    `Date` date NOT NULL,
    `Title` varchar(255) NOT NULL,
    `Subtitle` varchar(255),
    `XML` BLOB NOT NULL,
    CONSTRAINT PK_Runsheets PRIMARY KEY (`Campus`,`Service`,`Date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*CREATE TABLE `Shows` (

)*/