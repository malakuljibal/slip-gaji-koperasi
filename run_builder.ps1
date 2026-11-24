$workersJson = Get-Content "workers_data.json" -Raw -Encoding UTF8
$rekapJson = Get-Content "rekap_data.json" -Raw -Encoding UTF8

$pyContent = Get-Content "build_index.py" -Raw -Encoding UTF8

$startIndex = $pyContent.IndexOf('html_template = """') + 'html_template = """'.Length
$endIndex = $pyContent.LastIndexOf('"""')
$htmlTemplate = $pyContent.Substring($startIndex, $endIndex - $startIndex)

$htmlFinal = $htmlTemplate.Replace("WORKERS_JSON_PLACEHOLDER", $workersJson).Replace("REKAP_JSON_PLACEHOLDER", $rekapJson)

Set-Content "index.html" $htmlFinal -Encoding UTF8
Set-Content "app/src/main/assets/index.html" $htmlFinal -Encoding UTF8
Write-Host "Index files generated successfully! Final length: $($htmlFinal.Length)"
