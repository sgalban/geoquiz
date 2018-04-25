import json
import re

data = json.load(open('all.json'))

sql_file = open("populate_religion.sql", "w")

for i in range(len(data)):
	cleaned_religions = []
	religions = data[i]["People and Society"]["Religions"]["text"].split(",")
	for religion in religions:
		cleaned_religion = religion.split("(")[0]
		cleaned_religion = re.split('(\d+)', cleaned_religion)[0]
		cleaned_religion = cleaned_religion.strip()
		if len(cleaned_religion) > 1 and cleaned_religion[0].istitle():
			cleaned_religion = cleaned_religion.replace(")","")
			cleaned_religion = cleaned_religion.replace("-","")
			cleaned_religion = cleaned_religion.replace(".","")
			cleaned_religion = cleaned_religion.replace("<","")
			cleaned_religion = cleaned_religion.split("/")[0]
			cleaned_religion = cleaned_religion.split(" and ")[0]
			cleaned_religion = cleaned_religion.split(" or ")[0]
			cleaned_religion = cleaned_religion.strip()
			if cleaned_religion != "Asian religions other than Buddhism" and \
				cleaned_religion != "African American religions" and \
				cleaned_religion != "Spiritualism and New Age religions":
				cleaned_religions.append(cleaned_religion)
				print(cleaned_religion)
	for religion in cleaned_religions:
		code = data[i]["Code"]
		query = "INSERT INTO Religions\nVALUES(\"" + \
			code + "\",\"" + \
		 religion + "\");\n"
		sql_file.write(query)

sql_file.close()