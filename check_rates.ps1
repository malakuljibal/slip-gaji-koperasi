$docId = "1rgSWAGeef9o2D-Eru6v2dzuTm_W8MMeb86Bt_Quo6Rk"
$sheets = @("Tarif Gaji", "Tarif", "Master Gaji", "Ketentuan Gaji", "Pengawas", "Default Gaji", "Setting", "Pengaturan", "Database Tarif", "Gaji Pengawas", "Daftar Gaji", "Skema Gaji")

foreach ($s in $sheets) {
    $encoded = [System.Web.HttpUtility]::UrlEncode($s)
    $url = "https://docs.google.com/spreadsheets/d/$docId/gviz/tq?tqx=out:csv&sheet=$encoded"
    try {
        $data = Invoke-RestMethod -Uri $url
        if ($data -and $data.Length -gt 50) {
            Write-Host "FOUND SHEET: '$s' (Length: $($data.Length))"
            $lines = ($data -split "`n")[0..10] -join "`n"
            Write-Host $lines
            Write-Host "----------------------------------"
        }
    } catch {
        # Not found
    }
}
