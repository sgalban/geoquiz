import json
from pprint import pprint

data = json.load(open('all.json'))

sql_file = open("populate_countries.sql", "w")
for i in range(94):
	code = data[i]["Code"]
	name = data[i]["Government"]["Country name"]["conventional short form"]["text"]
	pop = data[i]["People and Society"]["Population"]["text"]
	pop = pop.replace(",","")
	pop = pop.split(" ")[0]
	capital = data[i]["Government"]["Capital"]["name"]["text"]
	capital = capital.split(";")[0]
	capital = capital.split(":")[0]
	capital = capital.split(" (")[0]
	area = data[i]["Geography"]["Area"]["total"]["text"]
	area = area.replace(",","")
	area = area.split(" ")[0]
	gdp = data[i]["Economy"]["GDP (purchasing power parity)"]["text"]
	gdp = gdp.replace("$","")
	gdp_factor = gdp.split(" ")[1]
	gdp = float(gdp.split(" ")[0])
	if gdp_factor == "trillion":
		gdp *= 1000000000000
	else:
		gdp *= 1000000000
	gdp = str(gdp)
	gdp = gdp.split(".")[0]
	continent = ""
	try:
		continent = data[i]["Geography"]["Map references"]["text"]
	except KeyError:
		continent = "Europe"
	if continent == "Central America and the Caribbean":
		continent = "South America"
	elif continent == "Middle East":
		continent = "Africa"
	elif continent == "Oceania":
		continent = "Australia"
	elif continent == "Southeast Asia":
		continent = "Asia"
	elif continent == "Asia, Europe":
		continent = "Europe"

	query = "INSERT INTO Countries\nVALUES(\"" + \
		code + "\",\"" + \
		name + "\"," + \
		pop + ",\"" + \
		capital + "\"," + \
		area + "," + \
		gdp + ",\"" + \
		continent + "\");\n"
	sql_file.write(query)

sql_file.close()