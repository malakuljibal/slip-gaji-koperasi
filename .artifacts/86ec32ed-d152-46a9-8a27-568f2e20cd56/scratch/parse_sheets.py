import urllib.request
import re
import csv
import io

doc_id = "1rgSWAGeef9o2D-Eru6v2dzuTm_W8MMeb86Bt_Quo6Rk"
url = f"https://docs.google.com/spreadsheets/d/{doc_id}/edit?gid=1478052077"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

# Find sheet names and gids
sheet_matches = re.findall(r'sheetId":(\d+).*?"name":"([^"]+)"', html)
if not sheet_matches:
    sheet_matches = re.findall(r'name":"([^"]+)".*?sheetId":(\d+)', html)

print("Found Sheets:")
seen = set()
for m in sheet_matches:
    gid, name = (m[0], m[1]) if m[0].isdigit() else (m[1], m[0])
    if gid not in seen:
        seen.add(gid)
        print(f"- {name} (gid: {gid})")

        # Download sheet CSV via gviz
        csv_url = f"https://docs.google.com/spreadsheets/d/{doc_id}/gviz/tq?tqx=out:csv&gid={gid}"
        try:
            csv_req = urllib.request.Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})
            csv_data = urllib.request.urlopen(csv_req).read().decode('utf-8')
            filename = f"sheet_{gid}_{re.sub(r'[^a-zA-Z0-9]', '_', name)}.csv"
            with open(filename, "w", encoding="utf-8") as f:
                f.write(csv_data)
            print(f"  Saved {filename}")
        except Exception as e:
            print(f"  Failed CSV download for {name}: {e}")
