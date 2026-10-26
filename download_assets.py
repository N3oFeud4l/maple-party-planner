"""게임 보스 UI/주황버섯 공식 이미지를 로컬 에셋으로 한 번 내려받습니다.

사용: python download_assets.py
필요한 것은 Python 3 표준 라이브러리뿐입니다. 원본 이미지는 넥슨의 저작물이며,
공개 GitHub 저장소에 재배포하기 전에 해당 저작권·팬사이트 사용 정책을 확인하세요.
이미지를 다운로드하는 동안만 외부 서버에 연결하며, 웹앱 실행에는 외부 호출이 없습니다.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote
from urllib.error import HTTPError, URLError
import json, time

ROOT = Path(__file__).resolve().parent
BOSS_DIR = ROOT / 'assets' / 'bosses'
BRAND_DIR = ROOT / 'assets' / 'branding'
BOSS_DIR.mkdir(parents=True, exist_ok=True)
BRAND_DIR.mkdir(parents=True, exist_ok=True)

# 한국명 보스 → 프로젝트 파일명 + 위키 내 공식 게임 Boss UI 이미지 파일명 후보
BOSSES = {
 'zakum':['Zakum'], 'magnus':['Magnus'], 'hilla':['Hilla'],
 'papulatus':['Papulatus'], 'pierre':['Pierre'], 'vonbon':['Von Bon'],
 'bloody-queen':['Crimson Queen','Bloody Queen'], 'vellum':['Vellum'],
 'lotus':['Lotus'], 'damien':['Damien'],
 'guardian-angel-slime':['Guardian Angel Slime'], 'lucid':['Lucid'], 'will':['Will'],
 'dusk':['Gloom','Dusk'], 'verus-hilla':['Verus Hilla'],
 'darknell':['Darknell'], 'seren':['Chosen Seren','Seren'],
 'kalos':['Watcher Kalos','Kalos'], 'first-adversary':['First Adversary'],
 'kaling':['Kaling'], 'vellona':['Vellona'],
 'radiant-star':['Malefic Star','Radiant Star'], 'limbo':['Limbo'],
 'baldrix':['Baldrix'], 'jupiter':['Jupiter'], 'black-mage':['Black Mage']
}
BASE = 'https://media.maplestorywiki.net/yetidb/'
USER_AGENT='Mozilla/5.0 (compatible; MaplePartyPlanner/0.5; asset downloader for personal fan site)'

def download_png(url, path):
    req=Request(url,headers={'User-Agent':USER_AGENT, 'Accept':'image/png,image/*;q=0.8'})
    with urlopen(req,timeout=12) as r:
        data = r.read(5_000_001)
        if len(data)>5_000_000 or not data.startswith(b'\x89PNG\r\n\x1a\n'):
            raise ValueError('PNG 형식이 아니거나 5MB를 초과합니다')
    path.write_bytes(data)

credits=[]; downloaded=[]
for slug, names in BOSSES.items():
    dest=BOSS_DIR/(slug+'.png')
    if dest.exists():
        downloaded.append(slug); continue
    found=None
    # 422px Boss UI, 778px Boss Entry UI 모두 게임의 실제 이미지를 사용합니다.
    for name in names:
        for prefix in ('Boss_UI_-_', 'Boss_Entry_UI_-_'):
            filename=prefix+name.replace(' ','_')+'.png'
            url=BASE+quote(filename, safe='_-.')
            try:
                download_png(url,dest)
                found=url; downloaded.append(slug)
                print('받음:',slug,filename)
                break
            except (HTTPError,URLError,TimeoutError,ValueError,OSError):
                pass
        if found: break
    if found: credits.append((slug,found))
    else: print('미확보:',slug, '(기존 SVG 대체 이미지를 유지합니다)')
    time.sleep(0.08)

logo=BRAND_DIR/'mushroom.png'
logo_url='https://nxcache.nexon.net/cms/2021/q2/1802/mushroom.png'
try:
    if not logo.exists(): download_png(logo_url,logo)
    html=ROOT/'index.html'; text=html.read_text(encoding='utf-8')
    text=text.replace('./assets/branding/mushroom.svg','./assets/branding/mushroom.png')
    html.write_text(text,encoding='utf-8')
    print('받음: 공식 메이플스토리 버섯 로고')
except (HTTPError,URLError,TimeoutError,ValueError,OSError) as exc:
    print('버섯 이미지 다운로드 실패:',str(exc)[:130], '기존 로컬 SVG 유지')

(BOSS_DIR/'manifest.js').write_text('window.MAPLE_BOSS_IMAGES = '+json.dumps(downloaded,ensure_ascii=False)+';\n',encoding='utf-8')
(ROOT/'IMAGE_SOURCES.md').write_text('''# 로컬 게임 이미지 출처\n\n넥슨의 메이플스토리 게임 이미지 사용에 대한 권리는 원저작자에게 있습니다.\n원본을 배포할 경우 적용되는 공식 저작권 가이드를 확인하고 필요한 권한을 확보하세요.\n\n다운로드 확인된 목록:\n\n'''+''.join(f'- `{name}.png`: {url}\n' for name,url in credits)+f'\n- 공식 버섯 로고: {logo_url}\n',encoding='utf-8')
print(f'완료: {len(downloaded)}/{len(BOSSES)}개 실제 보스 이미지 사용, 미확보된 보스는 기존 SVG 적용')
