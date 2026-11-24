$docId = "1rgSWAGeef9o2D-Eru6v2dzuTm_W8MMeb86Bt_Quo6Rk"
$url = "https://docs.google.com/spreadsheets/d/$docId/edit?gid=1478052077"

$web = Invoke-WebRequest -Uri $url -UserAgent "Mozilla/5.0" -UseBasicParsing
$html = $web.Content

$regex = [regex]'sheetId":(\d+).*?"name":"([^"]+)"'
$matches = $regex.Matches($html)

Write-Host "Found Sheets in HTML:"
$gids = @{}

foreach ($m in $matches) {
    $gid = $m.Groups[1].Value
    $name = $m.Groups[2].Value
    if (-not $gids.ContainsKey($gid)) {
        $gids[$gid] = $name
        Write-Host "  Sheet: $name (gid: $gid)"

        $csvUrl = "https://docs.google.com/spreadsheets/d/$docId/gviz/tq?tqx=out:csv&gid=$gid"
        $safeName = $name -replace '[^a-zA-Z0-9]', '_'
        $outFile = "sheet_${gid}_${safeName}.csv"
        try {
            Invoke-RestMethod -Uri $csvUrl -OutFile $outFile
            Write-Host "    Saved $outFile"
        } catch {
            Write-Host "    Failed download for $name"
        }
    }
}
