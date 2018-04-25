CREATE TABLE Religions (
	countryCode char(2) NOT NULL,
	religion varchar(255) NOT NULL,
	PRIMARY KEY(countryCode,religion),
	FOREIGN KEY(countryCode) REFERENCES Countries(Code));