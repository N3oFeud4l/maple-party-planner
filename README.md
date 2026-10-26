# 메이플 파티 플래너 v0.4.0

GitHub Pages에 올려 사용할 수 있는 HTML / CSS / JS 웹앱입니다. 설치·빌드 불필요.

## 배포

GitHub 저장소의 루트에 `index.html`, `style.css`, `app.js`, `assets/` 폴더를 업로드하세요. `Settings → Pages → Deploy from a branch → main / (root)`에서 공개할 수 있습니다.

### Nexon API 연결

`worker/nexon-proxy.js`를 Cloudflare Worker로 배포하고 **Secret `NEXON_API_KEY`** 및 **Text `ALLOWED_ORIGIN`**(GitHub Pages의 `location.origin`)을 등록하세요. 웹사이트의 `API 설정`에서 새 Worker 기본 URL을 넣으면 조회됩니다. 외부에 API 키를 공개하거나 GitHub에 올리지 마세요.

Worker 코드를 **다시 배포해야** 아케인포스·어센틱포스를 자동으로 받을 수 있습니다. 기존 캐릭터는 자동 갱신되지 않으므로 새로 조회하거나 캐릭터 편집창에서 수동 입력해야 합니다.

### 보스 이미지 (100% 로컬)

`assets/bosses/*.svg`가 사용되며, 사용자 브라우저에서 타사 이미지 서버를 호출하지 않습니다. 현재 수록된 SVG는 프로젝트용 **자체 제작 대체 아이콘**으로, 넥슨 공식 보스 일러스트가 아닙니다. 실제 게임 이미지는 자동 다운로드 가능한 출처 및 재배포 권한을 확인하지 못하여 동봉하지 않았습니다.

실제 이미지로 교체하려면 적법하게 확보한 이미지를 `assets/bosses/`에 넣고 `app.js`의 `bossCover()` 경로 확장자 `.svg`를 `.png` 또는 `.webp`로 수정하면 됩니다. 기존 SVG와 같은 slug를 유지하세요. 일부만 교체하려면 `bossCover()`에서 개별 파일 이름을 분기해 주세요.

### 데이터 유지

기존 저장 키 `maple_party_planner_web_v03`을 계속 사용합니다. 같은 `*.github.io` 도메인 내 저장소 경로만 변경하면 localStorage 저장 출처는 동일합니다. 사용자명이나 커스텀 도메인이 변경되면 출처가 달라지므로 **기존 URL에서 JSON 백업 → 새 URL에서 복원**하세요.

개인 배율 합계 및 예상 시간은 단순 참고 계산이며 환산주스탯 공식 파티 배율 계산값이 아닙니다.

## 폴더

- `index.html`: 레이아웃, 모달
- `style.css`: Toss 스타일에서 영감을 얻은 자체 UI 스타일
- `app.js`: 등록, 파티, 계산, 저장
- `assets/bosses/`: 빌드 의존 없는 로컬 이미지
- `worker/nexon-proxy.js`: 선택적인 넥슨 API 중계 Worker
