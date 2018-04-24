from bs4 import BeautifulSoup
import requests
import os, os.path, csv
import json

listingurl = "http://www.espn.com/college-sports/football/recruiting/databaseresults/_/sportid/24/class/2006/sort/school/starsfilter/GT/ratingfilter/GT/statuscommit/Commitments/statusuncommit/Uncommited"
response = requests.get(listingurl)
soup = BeautifulSoup(response.text, "html.parser")

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
			city_dictionary[city.text.encode('utf-8').rstrip()] = {'country':country.rstrip(), 'population':population.rstrip()}
			count += 1
		if count == 242:
			break

	with open('city_result.json', 'w') as fp:
		json.dump(city_dictionary, fp)



def main():
	parse_cities()

if __name__ == '__main__':
	main()
