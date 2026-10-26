# 메이플 파티 플래너 v0.3.0

GitHub Pages에 바로 올릴 수 있는 **순수 HTML/CSS/JavaScript** 웹앱입니다. 별도 빌드나 외부 라이브러리가 필요 없습니다.

## 핵심 기능

- 사용자 보관함: 기본 **'나' 한 명**, 필요할 때 사용자 추가, 이름 변경, 삭제
- 캐릭터 등록: API 없이 직접 등록 / 선택적 넥슨 Open API 조회 후 저장
- 캐릭터 정보: 캐릭터명, 이미지, 직업, 월드, 레벨, 전투력, 본캐·부캐
- 각 캐릭터를 펼쳐 **주간/월간 보스별 난이도마다 퍼센트** 입력, 자동 저장
- 파티 1~6명 설정, 캐릭터를 슬롯에 드래그 앤 드롭 / `+ 파티 추가` 버튼 사용
- 다중 파티 생성, 파티별 편성 기록, 같은 사용자 캐릭터의 중복 편성 방지
- 지정한 보스 기준 캐릭터별 배율, 입력 여부, 단순 합산 배율 및 참고 시간 표시
- 100% 최소컷 / 110% 기본 / 130% 메청년 / 150% 메린이 / 200% 메애기 각 20분 기준
- localStorage 자동 저장 / JSON 내보내기·불러오기

**주의: 환산주스탯 API는 호출하지 않습니다.** 파티 합계는 각 캐릭터가 입력한 개인 보스 배율의 단순 합계입니다. 실제 파티 배율과 다를 수 있으므로 '참고 합계'로만 취급합니다. 시간도 이 합계에 기반한 단순 추정치입니다. 배율이 한 명이라도 없으면 시간 예측을 표시하지 않습니다.

## GitHub Pages 배포

1. GitHub에 새 저장소를 만듭니다.
2. `index.html`, `style.css`, `app.js`, `README.md`를 **레포지토리 루트**에 업로드합니다. (`worker/` 폴더는 나중에 API 연동을 위해 보관 가능.)
3. 저장소 **Settings → Pages → Source: Deploy from a branch → Branch: main / (root)**를 선택해 저장합니다.
4. `https://사용자명.github.io/저장소명/`으로 접속해 사용합니다.
5. 저장 데이터는 브라우저와 웹사이트 출처별로 별개입니다. 서로 다른 PC에서는 JSON 백업·복원으로 옮기세요. 브라우저 기록/사이트 데이터 삭제 시 localStorage가 없어질 수 있으므로 주기적 백업을 권장합니다.

프록시를 사용하지 않아도 캐릭터 수동 추가, 배율 입력, 파티 구성은 모두 작동합니다.

## 넥슨 Open API 연결(선택)

1. [NEXON Open API](https://openapi.nexon.com/)에서 사용할 키를 발급받습니다.
2. Cloudflare 대시보드에서 **Workers & Pages → Create → Worker**를 만들고 `worker/nexon-proxy.js` 내용을 배포합니다.
3. Worker **Settings → Variables and Secrets**에서 다음 두 값을 입력합니다.
   - `NEXON_API_KEY`: **Secret**으로 저장. GitHub 파일이나 브라우저에 절대 넣지 마세요.
   - `ALLOWED_ORIGIN`: GitHub Pages의 **출처(Origin)**. 예를 들어 GitHub Pages 주소가 `https://myname.github.io/maple-party/`라면 **`https://myname.github.io`** 입니다. `/maple-party/` 경로는 포함하지 않습니다.
4. 배포 후 Worker URL `https://...workers.dev`를 복사합니다.
5. 사이트 상단 **API 설정**에서 Worker URL을 넣고 저장합니다.
6. 닉네임 입력 → **넥슨 조회** → 미리보기 → **보관함에 저장** 순서로 사용합니다.

Worker는 `/character?name=...`에서 넥슨 API의 `id`, `character/basic`, `character/stat`을 조회해 필요한 필드만 반환합니다. 전투력은 `final_stat` 중 `전투력` 필드를 이용합니다. 일부 캐릭터의 스탯을 조회할 수 없으면 전투력이 미조회로 표시될 수 있습니다.

**보안:** `ALLOWED_ORIGIN`은 브라우저 접근을 제어하는 CORS 값일 뿐, 인증이 아닙니다. 공개 Worker URL을 알고 Origin 헤더를 위조하는 요청 등을 완벽히 차단하지는 못합니다. 실제 대중 서비스라면 Cloudflare WAF/Rate Limiting, 별도 인증, 요청 수 제한 등을 추가하세요. 개인 사용 목적에 맞춘 최소 구현입니다.

## 저장 자료 형식

`maple_party_planner_web_v03` 키로 사용자·캐릭터·배율·파티·설정이 저장됩니다. 캐릭터 배율은 `주간|벨로나|노멀` 같은 고정 키에 저장됩니다. v0.2 저장 자료가 있으면 **캐릭터/파티 편성만 자동 이전**합니다. 이전 버전의 **파티 단위 배율**은 캐릭터 개인 배율로 임의 전환하지 않으며 이전 localStorage 키도 삭제하지 않습니다.

## 이번 버전에서 제외한 기능

- 환산주스탯 외부 API/스크래핑
- 파티 직업 시너지나 실전 딜량을 반영한 공식 배율 계산
- 자동 다중 기기 동기화
- 게임 내 파티 구성·보스 클리어 기록 자동 동기화

## 참고

- [NEXON Open API](https://openapi.nexon.com/ko/game/maplestory/)
- [메이플스토리 보스 공식 가이드](https://maplestory.nexon.com/Guide/N23GameInformation/Articles/458)
- [Cloudflare Workers 설명서](https://developers.cloudflare.com/workers/)
- [GitHub Pages 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

보스/난이도 목록은 `app.js` 상단 `BOSS_GROUPS`에서 수정할 수 있습니다. 게임 업데이트에 따라 변경될 수 있는 정적 목록입니다.
