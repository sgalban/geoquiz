import json
from pprint import pprint

data = json.load(open('all.json'))

code_dict = {}

for i in range(94):
	code = data[i]["Code"]
	name = data[i]["Government"]["Country name"]["conventional short form"]["text"]
	code_dict[name] = code

## Example
print(code_dict["Syria"])