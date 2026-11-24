Add-Type -AssemblyName System.Web

$docId = "1rgSWAGeef9o2D-Eru6v2dzuTm_W8MMeb86Bt_Quo6Rk"
$sheetNames = @("Database Pekerja", "Pembayaran Pemetik", "Database Gaji", "Jurnal Umum")

foreach ($name in $sheetNames) {
    Write-Host "Searching for '$name'..."
    $encoded = [System.Web.HttpUtility]::UrlEncode($name)
    $csvUrl = "https://docs.google.com/spreadsheets/d/$docId/gviz/tq?tqx=out:csv`&sheet=$encoded"
    $safeName = $name -replace '[^a-zA-Z0-9]', '_'
    $outFile = "sheet_${safeName}.csv"
    try {
        Invoke-RestMethod -Uri $csvUrl -OutFile $outFile
        Write-Host "  Downloaded $outFile successfully!"
    } catch {
        Write-Host "  Error downloading $name"
    }
}
