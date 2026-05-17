Add-Type -AssemblyName System.Drawing

$sourcePath = "logo.jpeg"
$sourceImg = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image {
    param($img, $width, $height, $outPath, $formatName)
    $newImg = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($newImg)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($img, 0, 0, $width, $height)
    
    if ($formatName -eq "Png") {
        $newImg.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } elseif ($formatName -eq "Jpeg") {
        $newImg.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    }
    
    $graphics.Dispose()
    $newImg.Dispose()
}

# Generate favicon (64x64)
Resize-Image -img $sourceImg -width 64 -height 64 -outPath "favicon.png" -formatName "Png"

# Generate PWA icons
Resize-Image -img $sourceImg -width 192 -height 192 -outPath "icon-192.png" -formatName "Png"
Resize-Image -img $sourceImg -width 512 -height 512 -outPath "icon-512.png" -formatName "Png"

# Generate Open Graph image (600x600 for WhatsApp)
Resize-Image -img $sourceImg -width 600 -height 600 -outPath "og-image.jpeg" -formatName "Jpeg"

$sourceImg.Dispose()
Write-Output "Icons generated successfully!"
