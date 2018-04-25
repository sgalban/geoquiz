from bs4 import BeautifulSoup
import requests
import os, os.path, csv
import json

def parse_cities():
	count = 0
	data = json.load(open('db_files/all.json'))
	code_dict = {}

	for i in range(114):
		code = data[i]["Code"]
		name = data[i]["Government"]["Country name"]["conventional short form"]["text"]
		code_dict[name] = code

	link = 'https://en.wikipedia.org/wiki/List_of_largest_cities'
	response = requests.get(link)
	soup = BeautifulSoup(response.text, "html.parser")
	city_dictionary = {}
	for rows in soup.find_all("tr"):
		city = rows.find('th', { 'scope' : 'row' })
		if city:
			attributes = [el.text.encode('utf-8') for el in rows.find_all('td')]
			country = attributes[0].split('\xc2\xa0')[1]
			population = attributes[2].split('[')[0]
			population = population.replace(',', '').strip()
			if country == 'Korea, South':
				country = 'South Korea'
			elif country == 'Korea, North':
				country = 'North Korea'
			elif country == '':
				continue
			count += 1
			city_text = city.text.encode('utf-8').strip()
			print(city_text)
			if 'Paulo' in city_text:
				city = 'San Paulo'
			if 'Bogot' in city_text:
				city = 'Bogota'
			if 'zmir' in city_text:
				city = 'Izmir'
			if 'Bras' in city_text:
				city = 'Brasilia'
			if 'Yaound' in city_text:
				city = 'Yaounde'
			if 'rdoba' in city_text:
				city = 'Cordoba'
				
			if city_text == "Xi'an":
				continue
			if population == ' 1029556':
				population = population[1:]
			city_dictionary[city_text] = {'country':code_dict[country.strip()], 'population':population}
		if count == 240:
			break

	with open('city_result.json', 'w') as fp:
		json.dump(city_dictionary, fp)

	with open('city_populate.sql', 'w') as fp:
		for city in city_dictionary.keys():
			population = city_dictionary[city]['population']
			country = city_dictionary[city]['country'].encode('utf-8')
			fp.write("INSERT INTO Cities (name, countryCode, population) VALUES (\'" + city + "\', " + "\'" + country + "\', " + population + ");\n")

def parse_mountains():
	link = 'https://en.wikipedia.org/wiki/List_of_highest_mountains_on_Earth'
	response = requests.get(link)
	soup = BeautifulSoup(response.text, "html.parser")
	mountain_dictionary = {}

	data = json.load(open('db_files/all.json'))
	code_dict = {}

	for i in range(94):
		code = data[i]["Code"]
		name = data[i]["Government"]["Country name"]["conventional short form"]["text"]
		code_dict[name] = code

	for rows in soup.find_all('tr'):
		mountain = rows.find_all('td')
		if len(mountain) == 11:
			s = mountain[10].text.encode('utf-8', 'ignore').strip()
			countries = s.split()
			if len(countries) > 1:
				if 'dp' in s:
					if len(countries) == 2:
						country = countries[0]
					elif len(countries) == 4:
						if '][' not in s:
							country = countries[2]
						else:	
							country = countries[1].split('[')[0]
					else:
						country = countries[2]

				else:
					country = countries[1]

			else:
				country = countries[0]
			if '[' in country:
				country = country.split('[')[0]
			if '4' in s:
				country = 'Bhutan'
			elif '6' in s:
				country = 'China'
			elif 'Jongsong' in mountain[1].text:
				country = 'China'

			unavail_countries = ['Bhutan', 'Tajikistan']
			if country in unavail_countries:
				continue
			elif country == 'Nepal':
				code_dict[country] = 'np'
		
			peak = mountain[1].text.encode('utf-8', 'ignore').strip().split('/')[0].split('[')[0].strip()
			elevation = mountain[3].text.encode('utf-8', 'ignore').strip()
			elevation = elevation.replace(',', '').strip()
			mountain_dictionary[peak] = {'elevation':elevation, 'country':code_dict[country.strip()]}

	with open('mountain_result.json', 'w') as fp:
		json.dump(mountain_dictionary, fp)

	with open('mountain_populate.sql', 'w') as fp:
		for mountain in mountain_dictionary.keys():
			elevation = mountain_dictionary[mountain]['elevation']
			country = mountain_dictionary[mountain]['country'].encode('utf-8')
			fp.write("INSERT INTO Mountains (name, countryCode, elevation) VALUES (\'" + mountain + "\', " + "\'" + country + "\', " + elevation + ");\n")


def main():
	parse_cities()
	parse_mountains()

if __name__ == '__main__':
	main()
