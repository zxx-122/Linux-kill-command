# rebuild_apk.py — 重建 APK：替换 index.html，保留原压缩方式，剔除旧签名
import zipfile, os, sys

SRC = r'D:\linux命令斩\Linux命令斩.apk.1'
OUT = r'D:\linux命令斩\Linux命令斩_v4.apk'
NEW_HTML = r'D:\linux命令斩\index.html'

SIGN_SUFFIXES = ('.SF', '.RSA', '.DSA', '.MF')

zin = zipfile.ZipFile(SRC, 'r')
zout = zipfile.ZipFile(OUT, 'w')

count = 0
skipped = 0
for item in zin.infolist():
    name = item.filename
    # 剔除旧签名文件（META-INF 下的 MANIFEST.MF / *.SF / *.RSA / *.DSA）
    if name.startswith('META-INF/') and name.upper().endswith(SIGN_SUFFIXES):
        skipped += 1
        continue
    data = zin.read(name)
    if name == 'assets/public/index.html':
        with open(NEW_HTML, 'rb') as f:
            data = f.read()
        ni = zipfile.ZipInfo(name, item.date_time)
        ni.compress_type = zipfile.ZIP_DEFLATED
        ni.external_attr = item.external_attr
        zout.writestr(ni, data)
        count += 1
        print('替换: assets/public/index.html (deflate, %d bytes)' % len(data))
    else:
        ni = zipfile.ZipInfo(name, item.date_time)
        ni.compress_type = item.compress_type  # 保留原压缩方式（resources.arsc 保持 store）
        ni.external_attr = item.external_attr
        zout.writestr(ni, data)

zout.close()
zin.close()
print('完成: 替换 %d 文件, 剔除签名 %d 个' % (count, skipped))
print('输出: %s (%d bytes)' % (OUT, os.path.getsize(OUT)))
