# 메이플 파티 플래너 v0.6.5

기존 v0.6.3의 캐릭터·파티·보스 기능을 유지하면서 Lucide SVG 아이콘으로 UI 컨트롤을 통일했습니다.

## 이번 업데이트
- 사용자·파티 접기/펼치기 화살표, 캐릭터 상세 이동, 보스 난이도 펼침 화살표를 동일한 Lucide chevron으로 변경
- 추가, 닫기, 수정, 새로고침, 검색, 백업, 복원, 초기화, 드래그 아이콘 교체
- 버튼의 아이콘 크기·정렬·간격과 select 화살표 정렬 개선
- 아이콘은 `assets/icons/`에서 로컬로 제공하므로 외부 CDN, 아이콘 폰트, API 연결이 필요하지 않음
- 모든 기존 `localStorage` 데이터·Cloudflare Worker 설정 유지

## 배포
기존 저장소의 `index.html`, `style.css`, `app.js`, `assets/icons/` 폴더를 업데이트합니다. 이전 버전 파일은 그대로 포함되어 있으며 Worker 배포는 불필요합니다.

## 아이콘 출처
Lucide 6.7.2, Fonticons Inc. SVG 아이콘(Creative Commons Attribution 4.0). 자세한 내용은 `assets/icons/ATTRIBUTION.md`를 확인하세요.

## v0.6.5 — Lucide icons
- Button, search, caret, edit, delete, refresh and backup/restore icons use local Lucide SVG assets.
- A uniform 16px base size and 1.75px strokes improve alignment.
- `assets/icons/LICENSE.md` records license details. No online CDN required.
- Existing localStorage keys and Cloudflare Worker settings are unchanged.
