import json

f = open('../settings.json', 'r').read()

print(f)
f = f.replace('\n', '')
print(f)

print()
print("json:")
j = json.loads(open('../settings.json', 'r').read().replace('\n', ''))
print(j)
print(j["wireless"]["ap"]["ssid"])