#!/bin/bash
# Verifica que cada href/src local en las paginas HTML apunte a un archivo
# que realmente existe, tras la reorganizacion en carpetas.
cd "$(dirname "$0")/.." || exit 1
broken=0
total=0
while IFS= read -r -d '' f; do
  dir=$(dirname "$f")
  while IFS= read -r val; do
    case "$val" in
      http*|mailto:*|tel:*|\#*|""|data:*|javascript:*) continue ;;
    esac
    clean="${val%%#*}"
    clean="${clean%%\?*}"
    [ -z "$clean" ] && continue
    total=$((total+1))
    resolved="$dir/$clean"
    if [ ! -e "$resolved" ]; then
      echo "BROKEN: $f -> $val"
      broken=$((broken+1))
    fi
  done < <(grep -oE '(href|src)="[^"]*"' "$f" | sed -E 's/^(href|src)="//; s/"$//')
done < <(find . -name "*.html" -not -path "./.git/*" -print0)
echo "----"
echo "Total refs revisadas: $total"
echo "Rotas: $broken"
