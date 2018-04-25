CREATE TABLE Languages (
	countryCode char(2) NOT NULL,
	language varchar(255) NOT NULL,
	PRIMARY KEY(countryCode,language),
	FOREIGN KEY(countryCode) REFERENCES Countries(Code));