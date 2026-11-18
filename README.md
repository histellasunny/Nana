# Malaysia & Singapore Travel Guide

2026년 11월 25일–12월 3일 가족 여행용 모바일 우선 웹사이트입니다.

## GitHub Repository 파일 구조
아래 5개 파일을 Repository 최상위(root)에 업로드합니다.
- index.html
- style.css
- app.js
- itinerary.json
- README.md

## 일정 수정
날짜별 시간표는 `itinerary.json`에 저장되어 있습니다. 새 공유 엑셀의 `7박 스케줄` 시트를 반영해 날짜별 일정을 갱신했습니다. `경비(개별)` 및 `호텔` 시트는 별도 예산 페이지가 요청되지 않아 이번 웹사이트 일정 변경에는 반영하지 않았습니다.

## GitHub Pages 배포
Repository → Settings → Pages → Deploy from a branch → `main` → `/(root)`로 설정합니다.

## 지도 안내
Leaflet과 OpenStreetMap 타일을 사용합니다. 지도는 장소명을 바탕으로 검색하며, 음식점·대안 장소는 Google Maps 검색 링크도 제공합니다. 지점이 여러 개인 식당은 사용자가 전달한 정확한 Google Maps 공유 링크 또는 확인된 지점을 기준으로 고정 핀으로 보완할 수 있습니다. 지도 경로선은 참고용 직선이며 실제 도로/보행 경로가 아닙니다.

## 일정 데이터 원칙
새 업로드 엑셀의 날짜, 시각, 항목, 비고 순서를 반영했습니다. 시간이 없던 하위 항목은 상위 시간 블록을 그대로 사용했습니다. 장소가 `?` 또는 미정으로 표시된 부분은 임의로 정하지 않았습니다.


## 이번 업데이트
- DAY 2 야간 수영 또는 The Exchange TRX 선택지 유지
- DAY 4 미제공 정보는 미정으로 표시
- DAY 6 야경 장소를 CE LA VI로 확정하고 ATLAS 제거
- DAY 8 Jewel Early Check-in Lounge 항공사: Singapore Airlines
- 일정의 장소명에서 Google Maps 검색 링크를 바로 열 수 있도록 추가
- 비용 정보는 웹사이트에서 사용하지 않음
