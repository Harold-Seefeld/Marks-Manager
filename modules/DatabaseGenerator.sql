-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema manager
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema manager
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `manager` DEFAULT CHARACTER SET utf8 ;
USE `manager` ;

-- -----------------------------------------------------
-- Table `manager`.`accounts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `manager`.`accounts` (
  `account_id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(256) NOT NULL,
  PRIMARY KEY (`account_id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC),
  UNIQUE INDEX `account_id_UNIQUE` (`account_id` ASC))
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `manager`.`tasks`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `manager`.`tasks` (
  `task_id` INT(11) NOT NULL AUTO_INCREMENT,
  `account_id` INT(11) NULL DEFAULT NULL,
  `subject` VARCHAR(50) NULL DEFAULT NULL,
  `name` VARCHAR(50) NULL DEFAULT NULL,
  `mark` INT(11) NULL DEFAULT NULL,
  `weighting` INT(11) NULL DEFAULT NULL,
  `date_due` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`task_id`),
  UNIQUE INDEX `UQ_ASN` (`account_id` ASC, `subject` ASC, `name` ASC))
ENGINE = InnoDB
AUTO_INCREMENT = 8
DEFAULT CHARACTER SET = utf8;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
