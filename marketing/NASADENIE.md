# Nasadenie marketingového webu na bod.legal

Tento priečinok (`marketing/`) je celý marketingový web koreňovej domény
bod.legal: `index.html`, štyri právne dokumenty, `styles.css`, vlastné
písma a `favicon.svg`. Statické HTML bez zostavovania.

Web servuje priamo aplikačný server (server/_core/marketingSite.ts) podľa
domény v požiadavke: `bod.legal` dostane tento web, `app.bod.legal` dostane
aplikáciu. Žiadny ďalší hosting, žiadne ďalšie konto, žiadna ďalšia
pipeline. Nasadzuje sa spolu s appkou pri každom pushi do vetvy `selfhost`.

## Jednorazové zapojenie domény (klikačka, asi 5 minút)

1. **Railway**: otvor službu `bod.legal-emergent` → **Settings** →
   **Networking** → **+ Custom Domain**. Pridaj `bod.legal`. Railway ukáže
   cieľ pre DNS záznam (tvar `xyz.up.railway.app`). Zopakuj pre
   `www.bod.legal`.
2. **Cloudflare** → doména bod.legal → **DNS** → **Records**:
   - zmaž starý záznam `bod.legal → cname.manus.space` (spôsoboval chybu 403),
   - zmaž starý záznam `www → cname.manus.space`,
   - pridaj `CNAME`, Name `@`, Target podľa Railway, **DNS only (sivý oblak)**,
   - pridaj `CNAME`, Name `www`, Target podľa Railway, **DNS only**.
   - Oranžový oblak by zablokoval overenie domény v Railway, presne ako
     kedysi pri app.bod.legal. MX a poštových záznamov sa nedotýkaj.
3. Počkaj, kým Railway pri oboch doménach ukáže zelené overenie.

## Overenie

- `https://bod.legal` načíta úvodnú stránku.
- `https://www.bod.legal` presmeruje na `https://bod.legal` (301).
- `https://bod.legal/vop.html` načíta obchodné podmienky.
- Odkaz **Nahrať zmluvu** vedie na `https://app.bod.legal/`.
- Neznáma cesta (`/hocico`) presmeruje na úvod.

## Aktualizácie webu

Zmeň súbory v `marketing/`, commitni a pushni do `selfhost`. Railway nasadí
web spolu s appkou. Právne dokumenty sa negenerujú ručne: uprav `docs.json`
a spusti `python build_docs.py` (podrobnosti v hlavičke toho súboru).

## Čo tu zámerne nie je

Web neuvádza ceny, porovnávaciu tabuľku s inými advokátmi ani záruku
vrátenia peňazí. Tieto tvrdenia čakajú na odobrenie advokátom (Michal
Kilian) a do jeho podpisu smú byť len v aplikácii. Vďaka tomu môže
marketingový web ísť von hneď a nečakať na ten podpis.
