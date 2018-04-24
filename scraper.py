from bs4 import BeautifulSoup
import requests
import os, os.path, csv
import json

def parse_cities():
	count = 0
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
			city_dictionary[city.text.encode('utf-8').strip()] = {'country':country.strip(), 'population':population.strip()}
			count += 1
		if count == 242:
			break

	with open('city_result.json', 'w') as fp:
		json.dump(city_dictionary, fp)

def parse_mountains():
	link = 'https://en.wikipedia.org/wiki/List_of_highest_mountains_on_Earth'
	response = requests.get(link)
	soup = BeautifulSoup(response.text, "html.parser")
	mountain_dictionary = {}
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
		
			peak = mountain[1].text.encode('utf-8', 'ignore').strip().split('/')[0].split('[')[0].strip()
			elevation = mountain[3].text.encode('utf-8', 'ignore').strip()
			mountain_dictionary[peak] = {'elevation':elevation, 'country':country}

	with open('mountain_result.json', 'w') as fp:
		json.dump(mountain_dictionary, fp)


def main():
	#parse_cities()
	parse_mountains()

if __name__ == '__main__':
	main()
