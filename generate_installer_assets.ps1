Add-Type -AssemblyName System.Drawing

# Paths
$baseDir = "d:\CODES\prototype Desktop"
$logoPath = "$baseDir\resources\images\vire_logo.png"
$sidebarPath = "$baseDir\build\installerSidebar.bmp"
$headerPath = "$baseDir\build\installerHeader.bmp"

# Load logo
$logo = [System.Drawing.Image]::FromFile($logoPath)

# 1. Create Sidebar Image (164x314)
$sbWidth = 164
$sbHeight = 314
$sbFont = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$sbBrushText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

$sbBmp = New-Object System.Drawing.Bitmap($sbWidth, $sbHeight)
$sbGraphics = [System.Drawing.Graphics]::FromImage($sbBmp)
$sbGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#08090d"))

# Draw a subtle gradient/glow
$rect = New-Object System.Drawing.Rectangle 0, 0, $sbWidth, $sbHeight
$lgb = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, 
    [System.Drawing.ColorTranslator]::FromHtml("#161a29"), 
    [System.Drawing.ColorTranslator]::FromHtml("#08090d"), 
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
$sbGraphics.FillRectangle($lgb, $rect)

# Draw Logo
$logoSize = 100
$logoX = ($sbWidth - $logoSize) / 2
$logoY = ($sbHeight - $logoSize) / 2 - 20
$sbGraphics.DrawImage($logo, $logoX, $logoY, $logoSize, $logoSize)

# Draw "VIRE" Text
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sbGraphics.DrawString("VIRE", $sbFont, $sbBrushText, ($sbWidth / 2), ($logoY + $logoSize + 10), $sf)

$sbGraphics.Dispose()
$sbBmp.Save($sidebarPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
$sbBmp.Dispose()

# 2. Create Header Image (150x57)
$hdWidth = 150
$hdHeight = 57

$hdBmp = New-Object System.Drawing.Bitmap($hdWidth, $hdHeight)
$hdGraphics = [System.Drawing.Graphics]::FromImage($hdBmp)
$hdGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#08090d"))
$hdGraphics.FillRectangle($lgb, (New-Object System.Drawing.Rectangle 0, 0, $hdWidth, $hdHeight))

# Draw Logo nicely aligned to the right inside header
$hdLogoSize = 40
$hdLogoX = $hdWidth - $hdLogoSize - 10
$hdLogoY = ($hdHeight - $hdLogoSize) / 2
$hdGraphics.DrawImage($logo, $hdLogoX, $hdLogoY, $hdLogoSize, $hdLogoSize)

$hdGraphics.Dispose()
$hdBmp.Save($headerPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
$hdBmp.Dispose()

$logo.Dispose()
$lgb.Dispose()
$sbFont.Dispose()
$sbBrushText.Dispose()

Write-Output "Sidebar and Header BMP files correctly created."
