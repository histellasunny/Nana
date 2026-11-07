# Malaysia & Singapore Travel Guide

모바일 우선으로 제작한 정적 여행 일정 웹사이트입니다.

## 실행 방법
- `index.html`을 브라우저에서 열거나 VS Code의 Live Server로 실행하세요.
- 지도 타일, Leaflet, 웹폰트, 관광지 지오코딩에는 인터넷 연결이 필요합니다.
- 날짜별 일정은 `data/itinerary.json`에서 수정할 수 있습니다.

## GitHub Pages 배포
1. GitHub에서 새 Public Repository를 만듭니다.
2. 이 폴더 안의 `index.html`, `css`, `js`, `data`를 저장소 루트에 업로드합니다.
3. Repository의 Settings → Pages로 이동합니다.
4. Build and deployment에서 Deploy from a branch를 선택합니다.
5. Branch는 `main`, folder는 `/ (root)`를 선택하고 Save를 누릅니다.
6. 잠시 후 표시되는 GitHub Pages 주소로 접속합니다.

## 지도 안내
- Leaflet과 OpenStreetMap 타일을 사용합니다.
- 날짜별 장소는 Nominatim 검색으로 위치를 확인한 뒤 핀으로 표시합니다.
- 장소가 정확히 확인되지 않으면 임의 좌표를 만들지 않고 Google Maps 검색 링크를 제공합니다.
- Nominatim 공개 서비스는 사용량 제한이 있으므로 geocoding 요청 사이에 1초 이상 간격을 두었습니다. 대규모 트래픽용 서비스가 아닙니다.
- 실제 이동 경로는 도로/보행 경로 API가 아닌 장소 간 직선 연결입니다. 길찾기는 Google Maps 링크를 이용하세요.

## 일정 반영 원칙
- 사용자가 확인한 가족별 항공편 도착/출발 시각, 터미널 이동, 일정상 겹쳐 보이는 시간은 의도된 일정으로 보고 원본 그대로 유지했습니다.
- 식당 또는 BAR가 일정표에서 `미정`이나 `?`로 표시된 항목은 임의로 장소를 지정하지 않았습니다.
- BTS 일정도 원본 표기 그대로 일정 타임라인에 남겼으며, 구체적인 장소가 제공되지 않은 경우 지도 핀은 임의로 생성하지 않습니다.

## 참고
샘플 커버/관광 사진은 Unsplash 원격 이미지이며, 교체가 가능합니다.
