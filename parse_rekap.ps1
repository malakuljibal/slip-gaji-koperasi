$csv = Get-Content "sheet_Pembayaran_Pemetik.csv" -Encoding UTF8
$rekapList = @()

foreach ($line in $csv) {
    $fields = $line -split '","' | ForEach-Object { $_ -replace '^"|"$', '' }
    if ($fields.Length -ge 8) {
        $no = $fields[1].Trim()
        $nama = $fields[2].Trim()
        $regu = $fields[3].Trim()
        $hasilKg = $fields[4].Trim()
        $subTotal = $fields[5].Trim()
        $kasbon = $fields[6].Trim()
        $totalGaji = $fields[7].Trim()

        if ($no -match '^\d+$' -and $nama) {
            $item = @{
                no = [int]$no
                name = $nama
                regu = $regu
                hasilKg = if ($hasilKg) { [double]$hasilKg } else { 0 }
                subTotal = if ($subTotal) { $subTotal } else { "Rp 0" }
                kasbon = if ($kasbon) { $kasbon } else { "-" }
                totalGaji = if ($totalGaji) { $totalGaji } else { "Rp 0" }
            }
            $rekapList += $item
        }
    }
}

Write-Host "Total Rekap Records Extracted: $($rekapList.Count)"
$json = $rekapList | ConvertTo-Json -Depth 3
Set-Content "rekap_data.json" $json -Encoding UTF8
