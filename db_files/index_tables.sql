CREATE UNIQUE INDEX country_code
ON Countries (code);

CREATE INDEX city_code
ON Cities (countryCode);

CREATE INDEX mountain_code
ON Mountains (countryCode);

CREATE INDEX language_code
ON Languages (countryCode);

CREATE INDEX religion_code
ON Religions (countryCode);
