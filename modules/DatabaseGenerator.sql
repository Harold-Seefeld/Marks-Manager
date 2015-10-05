-- -----------------------------------------------------
-- Schema manager
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `manager` ;
CREATE SCHEMA IF NOT EXISTS `manager` DEFAULT CHARACTER SET utf8 ;
USE `manager` ;
-- -----------------------------------------------------
-- Table `manager`.`accounts`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `manager`.`accounts` ;

CREATE TABLE IF NOT EXISTS `manager`.`accounts` (
  `account_id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '',
  `username` VARCHAR(45) NOT NULL COMMENT '',
  `password` VARCHAR(256) NOT NULL COMMENT '',
  PRIMARY KEY (`account_id`)  COMMENT '',
  UNIQUE INDEX `username_UNIQUE` (`username` ASC)  COMMENT '',
  UNIQUE INDEX `account_id_UNIQUE` (`account_id` ASC)  COMMENT '')
ENGINE = InnoDB
AUTO_INCREMENT = 0
DEFAULT CHARACTER SET = utf8;
-- -----------------------------------------------------
-- Table `manager`.`subjects`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `manager`.`subjects` ;

CREATE TABLE IF NOT EXISTS `manager`.`subjects` (
  `subject_id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '',
  `account_id` INT(11) NOT NULL COMMENT '',
  `name` VARCHAR(50) NOT NULL COMMENT '',
  PRIMARY KEY (`subject_id`)  COMMENT '',
  UNIQUE INDEX `UQ_AN` (`account_id` ASC, `name` ASC)  COMMENT '')
ENGINE = InnoDB
AUTO_INCREMENT = 0
DEFAULT CHARACTER SET = utf8;
-- -----------------------------------------------------
-- Table `manager`.`tasks`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `manager`.`tasks` ;

CREATE TABLE IF NOT EXISTS `manager`.`tasks` (
  `task_id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '',
  `account_id` INT(11) NULL DEFAULT NULL COMMENT '',
  `subject` VARCHAR(50) NULL DEFAULT NULL COMMENT '',
  `name` VARCHAR(50) NULL DEFAULT NULL COMMENT '',
  `mark` INT(11) NULL DEFAULT NULL COMMENT '',
  `weighting` INT(11) NULL DEFAULT NULL COMMENT '',
  PRIMARY KEY (`task_id`)  COMMENT '',
  UNIQUE INDEX `UQ_ASN` (`account_id` ASC, `subject` ASC, `name` ASC)  COMMENT '')
ENGINE = InnoDB
AUTO_INCREMENT = 0
DEFAULT CHARACTER SET = utf8;