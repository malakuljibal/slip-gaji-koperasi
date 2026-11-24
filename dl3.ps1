$docId = "1rgSWAGeef9o2D-Eru6v2dzuTm_W8MMeb86Bt_Quo6Rk"
$url = "https://docs.google.com/spreadsheets/d/$docId/gviz/tq?tqx=out:csv&sheet=Pembayaran%20Pemetik"
Invoke-RestMethod -Uri $url -OutFile "live_pemetik.csv"
Get-Content "live_pemetik.csv" -Head 5

$url2 = "https://docs.google.com/spreadsheets/d/$docId/gviz/tq?tqx=out:csv&sheet=Database%20Keuangan"
Invoke-RestMethod -Uri $url2 -OutFile "live_keuangan.csv"
Get-Content "live_keuangan.csv" -Head 5
