$csvPekerja = Get-Content "sheet_Database_Pekerja.csv" -Encoding UTF8
$pekerjaList = @()

foreach ($line in $csvPekerja) {
    $fields = $line -split '","' | ForEach-Object { $_ -replace '^"|"$', '' }
    if ($fields.Length -ge 8) {
        $no = $fields[1].Trim()
        $nama = $fields[2].Trim()
        $kategori = $fields[3].Trim()
        $regu = $fields[4].Trim()
        $skema = $fields[5].Trim()
        $status = $fields[7].Trim()

        # Ensure it's a real worker entry
        if ($no -match '^\d+$' -and $nama -and $nama -notmatch '^\d+$') {
            $item = @{
                no = [int]$no
                name = $nama
                category = $kategori
                regu = if ($regu) { $regu } else { "-" }
                schema = if ($skema) { $skema } else { "-" }
                status = if ($status) { $status } else { "Aktif" }
            }
            $pekerjaList += $item
        }
    }
}

Write-Host "Total Real Workers Extracted: $($pekerjaList.Count)"
$json = $pekerjaList | ConvertTo-Json -Depth 3
Set-Content "workers_data.json" $json -Encoding UTF8
