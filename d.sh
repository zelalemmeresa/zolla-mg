set -e
rm -rf ~/zsite
git clone -q https://github.com/zelalemmeresa/zolla-mg ~/zsite
cd ~/zsite
command -v firebase >/dev/null || npm i -g firebase-tools
firebase deploy --only hosting --project zollamg --non-interactive
echo ZDONE
