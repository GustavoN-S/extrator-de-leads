# Feito por GustavoN-S (https://github.com/GustavoN-S)

Add-Type -AssemblyName System.Drawing

function New-Icon([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g   = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode     = 'AntiAlias'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.Clear([System.Drawing.Color]::Transparent)

  $r    = [Math]::Max(2, [int]($size * 0.22))
  $path2 = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d    = $r * 2
  $path2.AddArc(0, 0, $d, $d, 180, 90)
  $path2.AddArc($size - $d, 0, $d, $d, 270, 90)
  $path2.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
  $path2.AddArc(0, $size - $d, $d, $d, 90, 90)
  $path2.CloseFigure()
  $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 14, 17, 24))
  $g.FillPath($bg, $path2)

  $green = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 48, 196, 141))
  $cx = $size / 2.0
  $cy = $size * 0.40
  $rad = $size * 0.24

  $pin = New-Object System.Drawing.Drawing2D.GraphicsPath
  $pin.AddEllipse([float]($cx - $rad), [float]($cy - $rad), [float]($rad * 2), [float]($rad * 2))

  $tip = New-Object 'System.Drawing.PointF[]' 3
  $tip[0] = New-Object System.Drawing.PointF([float]($cx - $rad * 0.72), [float]($cy + $rad * 0.62))
  $tip[1] = New-Object System.Drawing.PointF([float]($cx + $rad * 0.72), [float]($cy + $rad * 0.62))
  $tip[2] = New-Object System.Drawing.PointF([float]$cx, [float]($size * 0.86))
  $pin.AddPolygon($tip)
  $g.FillPath($green, $pin)

  $hole = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 14, 17, 24))
  $hr = $rad * 0.40
  $g.FillEllipse($hole, [float]($cx - $hr), [float]($cy - $hr), [float]($hr * 2), [float]($hr * 2))

  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "gerado: $path ($size px)"
}

$dir = Join-Path $PSScriptRoot '..\icons'
foreach ($s in 16, 32, 48, 128) {
  New-Icon $s (Join-Path $dir "icon$s.png")
}
