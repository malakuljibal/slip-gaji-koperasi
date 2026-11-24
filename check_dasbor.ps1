Add-Type -AssemblyName System.Web

$docId = "1rgSWAGeef9o2D-Eru6v2dzuTm_W8MMeb86Bt_Quo6Rk"
$sheets = @("Dasbor Gaji", "Dasbor", "Database Gaji", "Pembayaran Pemetik", "Rekap Gaji")

foreach ($name in $sheets) {
    $encoded = [System.Web.HttpUtility]::UrlEncode($name)
    $csvUrl = "https://docs.google.com/spreadsheets/d/$docId/gviz/tq?tqx=out:csv`&sheet=$encoded"
    try {
        $data = Invoke-RestMethod -Uri $csvUrl
        Write-Host "Found sheet: $name (Length: $($data.Length))"
        $firstLines = ($data -split "`n")[0..10] -join "`n"
        Write-Host "  First 10 lines:"
        Write-Host $firstLines
    } catch {
        Write-Host "Not found: $name"
    }
}
