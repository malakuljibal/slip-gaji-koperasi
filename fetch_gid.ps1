$docId = "1rgSWAGeef9o2D-Eru6v2dzuTm_W8MMeb86Bt_Quo6Rk"

# Fetch by GID 1478052077
$urlGid = "https://docs.google.com/spreadsheets/d/$docId/gviz/tq?tqx=out:csv&gid=1478052077"
$dataGid = Invoke-RestMethod -Uri $urlGid
$dataGid | Set-Content -Path "sheet_dasbor_database_gaji.csv" -Encoding UTF8
Write-Host "Fetched GID 1478052077 (Length: $($dataGid.Length))"

# Fetch by Sheet Name "Dasbor Database Gaji"
$encodedName = [System.Web.HttpUtility]::UrlEncode("Dasbor Database Gaji")
$urlName = "https://docs.google.com/spreadsheets/d/$docId/gviz/tq?tqx=out:csv&sheet=$encodedName"
try {
    $dataName = Invoke-RestMethod -Uri $urlName
    Write-Host "Fetched Sheet 'Dasbor Database Gaji' (Length: $($dataName.Length))"
} catch {
    Write-Host "Failed fetching by name"
}
