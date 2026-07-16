# Nasadenie marketingového webu na bod.legal

Tento priečinok (`marketing/`) je celý marketingový web koreňovej domény
bod.legal. Statické HTML bez zostavovania: `index.html`, štyri právne
dokumenty, `styles.css`, `favicon.svg`. Aplikácia beží oddelene na
app.bod.legal (Railway) a tento web sa jej nijako nedotýka.

Hostiť budeme na Cloudflare Pages: DNS domény už je v Cloudflare, hosting
statických stránok je bezplatný a nasadzuje sa automaticky pri každom pushi
do GitHubu.

## Krok 1: Vytvor projekt v Cloudflare Pages

1. Prihlás sa na `dash.cloudflare.com`.
2. V ľavom menu klikni **Workers & Pages**, potom **Create**, karta **Pages**.
3. Zvoľ **Connect to Git** a vyber repozitár `robertduriska-droid/bod.legal-emergent`.
4. Nastav presne toto:
   - **Production branch**: `selfhost`
   - **Framework preset**: `None`
   - **Build command**: nechaj prázdne
   - **Build output directory**: `marketing`
5. Klikni **Save and Deploy**. Prvé nasadenie dostane adresu
   `nieco.pages.dev`, na ktorej si web hneď pozrieš.

## Krok 2: Uprac staré DNS záznamy

V Cloudflare otvor doménu bod.legal, záložka **DNS**.

1. Nájdi záznam pre koreň (`bod.legal` alebo `@`). Ak ukazuje na
   `cname.manus.space` alebo čokoľvek manusové, **zmaž ho**. Presne tento
   starý záznam je dôvod, prečo koreň dnes vracia chybu 403.
2. To isté sprav so záznamom `www`, ak ukazuje na Manus.
3. Záznamu `app` sa **nedotýkaj**: ten vedie na Railway a drží aplikáciu.

## Krok 3: Pripoj doménu k Pages

1. V projekte Pages otvor záložku **Custom domains**.
2. Klikni **Set up a custom domain**, zadaj `bod.legal`, potvrď. Cloudflare
   sám vytvorí správny DNS záznam.
3. Zopakuj pre `www.bod.legal`.

Do pár minút bude web živý na https://bod.legal aj https://www.bod.legal.

## Krok 4: Over

- `https://bod.legal` načíta úvodnú stránku bez chyby a s vysvietenou ikonou.
- `https://bod.legal/vop.html` načíta obchodné podmienky.
- Odkaz **Nahrať zmluvu** vedie na `https://app.bod.legal/`.

## Aktualizácie webu

Zmeň súbory v `marketing/`, commitni a pushni do vetvy `selfhost`.
Cloudflare Pages nasadí novú verziu sám, zvyčajne do minúty. Právne
dokumenty sa negenerujú ručne: uprav `docs.json` a spusti
`python build_docs.py` (podrobnosti v hlavičke toho súboru).

## Čo tu zámerne nie je

Web neuvádza ceny, porovnávaciu tabuľku s inými advokátmi ani záruku
vrátenia peňazí. Tieto tvrdenia čakajú na odobrenie advokátom (Michal
Kilian) a do jeho podpisu smú byť len v aplikácii. Vďaka tomu môže
marketingový web ísť von hneď a nečakať na ten podpis.
