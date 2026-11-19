# -*- coding: utf-8 -*-
"""三友ワークス：1ファイル版を作る

  python tools/build_1file.py

index.html と、js・css・fonts・img・voice の中身を、ぜんぶ1つのHTMLファイルに埋め込んで
sanyu_works_1file.html を作ります。

スマートフォン（Android など）で、zip を展開したフォルダの index.html を直接開くと、
となりのフォルダ（js や img）を読みこめずに動かないことがあります。
1ファイル版なら、そのファイル1つを開くだけで遊べます（音声・フォントもふくむ）。
※ 職種カードの Vlog 動画（movie フォルダ）は大きいので埋め込みません。
"""
import base64, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else 'sanyu_works_1file.html')
MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.woff': 'font/woff', '.woff2': 'font/woff2'}

def rd(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()

def data_uri(p):
    ext = os.path.splitext(p)[1].lower()
    with open(os.path.join(ROOT, p), 'rb') as f:
        return 'data:%s;base64,%s' % (MIME[ext], base64.b64encode(f.read()).decode('ascii'))

html = rd('index.html')
html = html.replace('<link rel="manifest" href="manifest.webmanifest">\n', '')   # 1ファイル版では使わない

# 1) CSS（フォントも埋め込む）
css = rd('css/style.css')
css = re.sub(r'url\("\.\./fonts/([^"]+)"\)', lambda m: 'url("%s")' % data_uri('fonts/' + m.group(1)), css)
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')

# 2) HTML の中の画像
html = re.sub(r'(src|href)="(img/[^"]+\.png)"', lambda m: '%s="%s"' % (m.group(1), data_uri(m.group(2))), html)

# 3) スクリプトで使う画像・音声
emb = {}
for d in ('img', 'voice'):
    for n in sorted(os.listdir(os.path.join(ROOT, d))):
        if os.path.splitext(n)[1].lower() in MIME and not n.startswith('icon-'):
            emb[d + '/' + n] = data_uri(d + '/' + n)
emb_js = 'window.SW_EMBED={\n' + ',\n'.join('%r:%r' % (k, v) for k, v in emb.items()) + '};'

# 4) スクリプトを埋め込む
def inline(m):
    src = rd(m.group(1))
    if '</script' in src.lower():
        raise SystemExit('script tag inside ' + m.group(1))
    return '<script>/* ' + m.group(1) + ' */\n' + src + '\n</script>'
html = html.replace('<script src="js/assets.js"></script>', '<script>' + emb_js + '</script>\n<script src="js/assets.js"></script>')
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)

left = re.findall(r'(?:src|href)="(?!data:|https?:|#)([^"$\'+]+)"', html)
if left:
    print('埋め込まれていない参照:', sorted(set(left)))
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)
print('作成しました:', OUT, '(%.1f MB)' % (os.path.getsize(OUT) / 1e6))
