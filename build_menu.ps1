$html = Get-Content -Raw "index.html" -Encoding UTF8

$sections = [regex]::Matches($html, '(?s)<section id="(.*?)".*?<h2 class="section-title">(.*?)</h2>(.*?)<div class="cards-grid">(.*?)</div>\s*</section>')

$categoriesHtml = ""

foreach ($sec in $sections) {
    $secId = $sec.Groups[1].Value
    $secTitle = $sec.Groups[2].Value
    $secNoteRaw = $sec.Groups[3].Value
    $cardsRaw = $sec.Groups[4].Value

    $note = ""
    if ($secNoteRaw -match '<p class="section-note">(.*?)</p>') {
        $note = $Matches[1]
    }

    $cards = [regex]::Matches($cardsRaw, '(?s)<div class="food-card.*?data-name="(.*?)".*?<p class="card-desc">(.*?)</p>.*?<span class="card-price">(.*?)</span>')
    
    if ($cards.Count -gt 0) {
        $itemsHtml = ""
        foreach ($card in $cards) {
            $name = $card.Groups[1].Value -replace '✦', '' -replace 'Popular', '' -replace 'Especial', '' -replace 'Recomendado', '' -replace 'Mixto', ''
            $name = $name.Trim()
            $desc = $card.Groups[2].Value.Trim()
            $price = $card.Groups[3].Value.Trim()

            $descHtml = ""
            if ($desc) { $descHtml = "<div class=`"item-desc`">$desc</div>" }

            $itemsHtml += @"
              <div class="item">
                <div class="item-header">
                  <div class="item-name">$name</div>
                  <div class="item-dots"></div>
                  <div class="item-price">$price</div>
                </div>
                $descHtml
              </div>
"@
        }

        $noteHtml = ""
        if ($note) { $noteHtml = "<div class=`"category-note`">$note</div>" }

        $categoriesHtml += @"
            <div class="category">
              <div class="category-title">$secTitle</div>
              $noteHtml
              $itemsHtml
            </div>
"@
    }
}

$template = @"
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Menú Físico - San José</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #fdfbf7;
      --text: #1a1a1a;
      --accent: #b08d57;
      --line: #e0dcd3;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #e0e0e0;
      color: var(--text);
      font-family: 'Inter', sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .sheet {
      width: 210mm;
      margin: 10mm auto;
      background: var(--bg);
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
      position: relative;
    }
    .cover {
      height: 297mm;
      padding: 20mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
      position: relative;
    }
    .cover-border {
      position: absolute;
      top: 15mm; bottom: 15mm; left: 15mm; right: 15mm;
      border: 2px solid var(--accent);
      outline: 1px solid var(--accent);
      outline-offset: -5px;
    }
    .cover-logo {
      width: 180px;
      height: 180px;
      object-fit: cover;
      border-radius: 50%;
      margin-bottom: 2rem;
      border: 4px solid var(--accent);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .cover-title {
      font-family: 'Bebas Neue', cursive;
      font-size: 6rem;
      letter-spacing: 6px;
      color: var(--text);
      line-height: 1;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
    }
    .cover-subtitle {
      font-family: 'Playfair Display', serif;
      font-size: 1.8rem;
      font-style: italic;
      color: var(--accent);
      margin-bottom: 4rem;
    }
    .cover-footer {
      position: absolute;
      bottom: 40mm;
      font-family: 'Inter', sans-serif;
      font-size: 1rem;
      color: #555;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .menu-pages {
      padding: 20mm;
      min-height: 297mm;
    }
    .menu-container {
      column-count: 2;
      column-gap: 15mm;
    }
    .category {
      break-inside: avoid;
      margin-bottom: 15mm;
    }
    .category-title {
      font-family: 'Bebas Neue', cursive;
      font-size: 2.4rem;
      color: var(--accent);
      border-bottom: 2px solid var(--accent);
      padding-bottom: 2px;
      margin-bottom: 8px;
      letter-spacing: 2px;
      text-align: center;
    }
    .category-note {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 0.9rem;
      color: #666;
      text-align: center;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    .item {
      break-inside: avoid;
      margin-bottom: 10px;
    }
    .item-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .item-name {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 1.05rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: var(--bg);
      padding-right: 6px;
      position: relative;
      z-index: 2;
      color: #000;
    }
    .item-dots {
      flex-grow: 1;
      border-bottom: 2px dotted var(--line);
      margin: 0 4px;
      position: relative;
      top: -4px;
      z-index: 1;
    }
    .item-price {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--text);
      background: var(--bg);
      padding-left: 6px;
      position: relative;
      z-index: 2;
    }
    .item-desc {
      font-family: 'Inter', sans-serif;
      font-weight: 300;
      font-size: 0.8rem;
      color: #444;
      line-height: 1.4;
      padding-right: 20px;
    }
    @media print {
      body { background: white; }
      .sheet { margin: 0; box-shadow: none; width: 100%; background: transparent; }
      .item-name, .item-price { background: white; }
    }
    .print-btn {
      position: fixed; bottom: 30px; right: 30px;
      background: var(--accent); color: white; border: none; padding: 15px 30px;
      border-radius: 50px; font-size: 1.1rem; font-family: 'Inter', sans-serif; font-weight: 600;
      cursor: pointer; box-shadow: 0 4px 15px rgba(176, 141, 87, 0.4);
      transition: transform 0.2s; z-index: 100;
    }
    .print-btn:hover { transform: scale(1.05); }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimir Menú Premium</button>
  <div class="sheet">
    <div class="cover">
      <div class="cover-border"></div>
      <img src="logo.jpeg" alt="Logo" class="cover-logo" onerror="this.style.display='none'">
      <div class="cover-title">SAN JOSÉ</div>
      <div class="cover-subtitle">Cocina Tradicional & Parrilla</div>
      <div class="cover-footer">Menú de Especialidades</div>
    </div>
  </div>
  <div class="sheet menu-pages">
    <div class="menu-container">
      $categoriesHtml
    </div>
  </div>
</body>
</html>
"@

Set-Content -Path "menu_impresion_premium.html" -Value $template -Encoding UTF8
