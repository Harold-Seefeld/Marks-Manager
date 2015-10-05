# Marks Manager
Marks Manager is a cloud-based school mark storer and calculator.

### Software Requirements
- NodeJS version >= 4
- MySQL server version >= 4

### Recommended System Requirements
- 1024MB RAM
- Windows, Linux or MacOSX operating system

## Setup
- Create the MySQL database using the appropriate queries
- Upload the code to a writable and readable directory
- Run `npm start` in that directory

If you are not using Openshift, then the ip and port will default to localhost:80.

To generate the database, use these queries:
```
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';
```
```
-- -----------------------------------------------------
-- Schema manager
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `manager` ;
CREATE SCHEMA IF NOT EXISTS `manager` DEFAULT CHARACTER SET utf8 ;
USE `manager` ;
```
```
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
AUTO_INCREMENT = 1
DEFAULT CHARACTER SET = utf8;
```
```
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
AUTO_INCREMENT = 1
DEFAULT CHARACTER SET = utf8;
```
```
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
AUTO_INCREMENT = 1
DEFAULT CHARACTER SET = utf8;
```
```
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
```
