import urllib.request
import urllib.parse
import json

query = """[out:json][timeout:25];
(
  way["building"](16.242,103.245,16.257,103.260);
  relation["building"](16.242,103.245,16.257,103.260);
);
out body;
>;
out skel qt;"""

url = 'https://overpass-api.de/api/interpreter?data=' + urllib.parse.quote(query)
req = urllib.request.Request(url, headers={'User-Agent': 'MsuMapProject/1.0'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print('Elements count:', len(data.get('elements', [])))
except Exception as e:
    print('Overpass error:', e)
