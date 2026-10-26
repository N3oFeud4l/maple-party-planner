# 메이플 파티 플래너 v0.5.0

## 설치와 배포

정적 파일 `index.html`, `style.css`, `app.js`, `assets/`를 GitHub에 그대로 업로드하고 Cloudflare Pages에 정적 사이트로 연결합니다. 프레임워크 없음, Build command 비워둠, Output directory `.` (index.html이 최상위에 있는 경우).

- 웹사이트가 열리면 API 주소가 자동 설정됩니다. **API 설정 화면은 제거**했습니다.
- `app.js` 위쪽 `WORKER_URL`에 기존 Cloudflare Worker의 HTTPS 주소가 고정되어 있습니다. 서버 주소를 변경한 경우 **이 한 줄만** 수정하고 GitHub에 커밋하세요.
- Worker의 `ALLOWED_ORIGIN`은 실제 **Cloudflare Pages 웹사이트의 origin** (`location.origin`, `/` 없이)으로 설정합니다.
- `NEXON_API_KEY`는 Worker Secret으로만 관리하며 GitHub에 넣지 마세요.
- `worker/nexon-proxy.js`를 다시 Cloudflare에 배포해야 `statStatus`가 응답됩니다. 캐릭터 카드의 ↻ 버튼으로 이미 등록된 포스 수치를 재조회할 수 있습니다. 스탯 호출 실패 시 0을 꾸며 표시하지 않고 '미조회' 및 조회 실패 상태를 표시합니다.
- 검색창에서 Enter 또는 넥슨 조회 버튼으로 조회합니다.
- 기존 `maple_party_planner_web_v03` 저장 키는 유지되므로 **동일한 도메인**에서 덮어쓰면 데이터가 유지됩니다. 도메인 변경 전 JSON 백업을 권장합니다.
- 주간·월간 보스 배율은 캐릭터를 클릭해 수정합니다. 파티 시간은 **개별 배율의 단순 합계**를 사용한 참고치이며 실제 파티 배율이 아닙니다.

## 보스·로고의 실제 게임 이미지 다운로드

프로젝트 폴더에서 `python download_assets.py`를 **한 번 실행**하면, 인터넷 연결이 가능한 컴퓨터에서 메이플스토리 게임 이미지를 다운로드하여 `assets/bosses/*.png`와 `assets/branding/mushroom.png`에 저장합니다. `manifest.js`에 성공한 파일을 기록하므로 웹사이트 이용 중에는 외부 이미지 요청이 없습니다. **다운로드 실패한 보스는 기존 로컬 SVG 대체 그림을 유지**합니다.

이 패키지에는 외부 다운로드 환경 제약으로 실제 넥슨 이미지 파일을 사전 포함하지 못했습니다. 해당 스크립트는 공식 버섯 이미지와 MapleStory Wiki가 호스팅하는 메이플스토리 게임 이미지를 시도하며 파일명 또는 접근 정책 변경에 따라 일부가 실패할 수 있습니다. 넥슨 저작물이므로 GitHub 공개 저장소에 재배포하기 전에 이용 조건·권리자 허용 범위를 확인하세요. 외부 이미지 출처는 `IMAGE_SOURCES.md`에 생성됩니다.

## 빠른 점검

1. `index.html` 열고 캐릭터 조회 (또는 직접 추가).
2. 검색창에서 Enter로 조회하고, 보관함에서 ↻ 클릭하면 정보 갱신.
3. 캐릭터 클릭 → 보스 난이도 배율 저장.
4. 파티 슬롯 구성 → 보스 클릭 → 참고 시간 확인.
5. F12 → Network에서 브라우저에 넥슨 API 키가 전달되지 않는지 확인.

Data based on NEXON Open API · 비공식 팬 프로젝트
