import json
import re

data = json.load(open('all.json'))

sql_file = open("populate_languages.sql", "w")

for i in range(len(data)):
	cleaned_languages = []
	languages = data[i]["People and Society"]["Languages"]["text"].split(",")
	for language in languages:
		cleaned_language = language.split("(")[0]
		cleaned_language = re.split('(\d+)', cleaned_language)[0]
		cleaned_language = cleaned_language.strip()
		if len(cleaned_language.split(" ")) == 1 and len(cleaned_language) > 1 and cleaned_language[0].istitle():
			cleaned_language = cleaned_language.replace(")","")
			cleaned_language = cleaned_language.replace("-","")
			cleaned_languages.append(cleaned_language)
	for language in cleaned_languages:
		code = data[i]["Code"]
		query = "INSERT INTO Languages\nVALUES(\"" + \
			code + "\",\"" + \
			language + "\");\n"
		sql_file.write(query)

sql_file.close()