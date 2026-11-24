import urllib.request
import urllib.parse
doc_id = "1rgSWAGeef9o2D-Eru6v2dzuTm_W8MMeb86Bt_Quo6Rk"
sheets = ["Rekap Gaji", "Dasbor Gaji"]
for s in sheets:
    url = f"https://docs.google.com/spreadsheets/d/{doc_id}/gviz/tq?tqx=out:csv&sheet={urllib.parse.quote(s)}"
    try:
        urllib.request.urlretrieve(url, f"sheet_{s.replace(' ', '_')}.csv")
        print(f"Downloaded {s}")
    except Exception as e:
        print(f"Failed {s}: {e}")
