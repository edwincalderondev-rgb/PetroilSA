$cp1252 = [Text.Encoding]::GetEncoding(1252)
$utf8 = [Text.Encoding]::UTF8

function Repair-Text($text) {
  $decoded = [Net.WebUtility]::HtmlDecode($text)
  if ($decoded -match 'Â|Ã|â€|ðŸ|�') {
    return $utf8.GetString($cp1252.GetBytes($decoded))
  }
  return $decoded
}

function Repair-Element($match) {
  $open = $match.Groups[1].Value
  $inner = Repair-Text $match.Groups[2].Value
  return "$open$inner</$($match.Groups[3].Value)>"
}

$files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
  $path = $file.FullName
  $content = [IO.File]::ReadAllText($path, $utf8)
  $original = $content

  # Only decode visible navigation content, never attributes.
  $content = [regex]::Replace($content, '(<span class="route-label">)(.*?)(</span>)', {
    param($m) Repair-Element $m
  }, 'Singleline')
  $content = [regex]::Replace($content, '(<a class="drawer-link"[^>]*>)(.*?)(</a>)', {
    param($m) Repair-Element $m
  }, 'Singleline')
  $content = [regex]::Replace($content, '(<a class="drawer-portal"[^>]*>)(.*?)(</a>)', {
    param($m) Repair-Element $m
  }, 'Singleline')
  $content = [regex]::Replace($content, '(<a class="portal-link"[^>]*>)(.*?)(</a>)', {
    param($m) Repair-Element $m
  }, 'Singleline')

  # Ficha routes use the real page anchors and descriptive labels.
  if ($file.Name -like 'ficha-tecnica-*.html' -or $file.Name -eq 'pqrsf.html') {
    $content = $content -replace '(<span class="route-label">)a(</span>)', '$1Descripción$2'
    $content = $content -replace '(<span class="route-label">)o(</span>)', '$1Contacto$2'
    $content = $content -replace '(drawer-node"[^>]*></span>\s*)a(\s*</a>)', '$1Descripción$2'
    $content = $content -replace '(drawer-node"[^>]*></span>\s*)o(\s*</a>)', '$1Contacto$2'
  }

  # The Euro 6 article has five fixed, concise route labels.
  if ($file.Name -eq 'euro-6-que-es-calidad-del-aire.html') {
    $labels = @('Euro 6', 'Emisiones', 'Cómo ayuda', 'Combustible', 'Transformación')
    $i = 0
    $content = [regex]::Replace($content, '(<span class="route-label">).*?(</span>)', {
      param($m)
      $value = "$($m.Groups[1].Value)$($labels[$script:i])$($m.Groups[2].Value)"
      $script:i++
      $value
    }, 'Singleline')
    $i = 0
    $content = [regex]::Replace($content, '(drawer-node"[^>]*></span>\s*).*?(\s*</a>)', {
      param($m)
      $value = "$($m.Groups[1].Value)$($labels[$script:i])$($m.Groups[2].Value)"
      $script:i++
      $value
    }, 'Singleline')
  }

  if ($content -ne $original) {
    [IO.File]::WriteAllText($path, $content.TrimEnd("`r","`n") + "`n", (New-Object Text.UTF8Encoding($false)))
    Write-Host $file.Name
  }
}
