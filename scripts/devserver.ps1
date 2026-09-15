param(
  [int]$Port = 8793,
  [string]$Root = (Get-Location).Path
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root on http://localhost:$Port/"

$mime = @{
  '.html'='text/html'; '.htm'='text/html'; '.css'='text/css'; '.js'='application/javascript';
  '.json'='application/json'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg';
  '.gif'='image/gif'; '.webp'='image/webp'; '.avif'='image/avif'; '.svg'='image/svg+xml';
  '.mp4'='video/mp4'; '.ico'='image/x-icon'; '.woff'='font/woff'; '.woff2'='font/woff2'
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($path -eq '/') { $path = '/index.html' }
    $full = Join-Path $Root ($path.TrimStart('/'))
    if (Test-Path $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full)
      $ct = $mime[$ext]
      if (-not $ct) { $ct = 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $res.ContentType = $ct
      $res.AddHeader('Accept-Ranges', 'bytes')
      # Soporte de peticiones por rango (206 Partial Content): los navegadores
      # piden los videos por tramos. Sin esto el servidor devolvía el archivo
      # completo a cada tramo y el navegador cancelaba esas respuestas
      # (filas "canceled" en el inspector de red al servir el sitio en local).
      $range = $req.Headers['Range']
      if ($range -and $range -match '^bytes=(\d*)-(\d*)$') {
        $len = $bytes.Length
        if ($Matches[1] -eq '') { $start = [Math]::Max(0, $len - [int64]$Matches[2]); $end = $len - 1 }
        else { $start = [int64]$Matches[1]; $end = if ($Matches[2] -eq '') { $len - 1 } else { [Math]::Min([int64]$Matches[2], $len - 1) } }
        if ($start -ge $len) {
          $res.StatusCode = 416
          $res.AddHeader('Content-Range', "bytes */$len")
        } else {
          $count = $end - $start + 1
          $res.StatusCode = 206
          $res.AddHeader('Content-Range', "bytes $start-$end/$len")
          $res.ContentLength64 = $count
          $res.OutputStream.Write($bytes, [int]$start, [int]$count)
        }
      } else {
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } else {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }
  } catch {
    $res.StatusCode = 500
  } finally {
    $res.OutputStream.Close()
  }
}
