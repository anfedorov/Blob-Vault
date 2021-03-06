CREATE USER 'blobby'@'localhost' IDENTIFIED BY '57umtSMG4Fyv5ary';
GRANT USAGE ON *.* TO 'blobby'@'localhost' IDENTIFIED BY '57umtSMG4Fyv5ary';
GRANT ALL PRIVILEGES ON blob_vault.* TO 'blobby'@'localhost';

CREATE DATABASE blob_vault;
USE blob_vault;

CREATE TABLE blobs (
  k char(64) NOT NULL,
  v varchar(32768) NOT NULL,
  pub_key varchar(64) NOT NULL,
  ip_last_updated_from INT UNSIGNED NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP NOT NULL,
  UNIQUE KEY k (k)
) ENGINE=InnoDB;