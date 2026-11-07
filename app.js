let tripData, currentDay=1, activeView="overview", currentMap=null, mapMarkers={}, geocodeCache={};
const app=document.getElementById("app");
const categoryNames={"이동":"이동","항공":"항공","공항":"공항","숙소":"숙소","관광":"관광","식사":"식사","쇼핑":"쇼핑","휴식":"휴식","자유시간":"자유시간"};
const dateFmt=d=>{const x=new Date(d+"T00:00:00");return `${x.getMonth()+1}.${String(x.getDate()).padStart(2,"0")} · ${["SUN","MON","TUE","WED","THU","FRI","SAT"][x.getDay()]}`};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function destroyMap(){if(currentMap){currentMap.remove();currentMap=null}mapMarkers={}}
function showOverview(){
  activeView="overview";destroyMap();
  app.innerHTML=`<section class="hero"><img src="${tripData.trip.cover}" alt="여행 대표 이미지"><div class="hero-content"><div class="eyebrow">FAMILY TRAVEL · 2026</div><h1>${esc(tripData.trip.title)}</h1><p>${esc(tripData.trip.subtitle)} · ${tripData.trip.duration} DAYS</p><div class="region-pills">${tripData.trip.regions.map(x=>`<span class="pill">${esc(x)}</span>`).join("")}</div></div></section>
  <div class="trip-meta"><div class="meta-card"><strong>09</strong><span>DAYS</span></div><div class="meta-card"><strong>25 NOV</strong><span>START</span></div><div class="meta-card"><strong>03 DEC</strong><span>RETURN</span></div></div>
  <div class="section-head"><h2>전체 여행 일정</h2><small>2026.11.25 — 12.03</small></div>
  <div class="day-list">${tripData.days.map(d=>`<button class="day-card" data-day="${d.day}"><div class="day-num"><b>${String(d.day).padStart(2,"0")}</b><span>DAY</span></div><div class="day-info"><strong>${esc(d.region)} <span class="muted">· ${dateFmt(d.date)}</span></strong><p>${esc(d.summary)}</p></div><span class="arrow">›</span></button>`).join("")}</div>
  <div class="footer-note">ITINERARY BASED ON THE PROVIDED SCHEDULE</div>`;
  document.querySelectorAll("[data-day]").forEach(b=>b.addEventListener("click",()=>showDay(+b.dataset.day)));
  setNav("overview");
}
function showDay(n){
  currentDay=n;activeView="day";destroyMap();
  const d=tripData.days.find(x=>x.day===n);if(!d)return;
  app.innerHTML=`<div class="detail-top"><div class="backline"><button class="back-button" id="back">← 전체 일정</button><div><button class="day-switch" id="prev" ${n===1?"disabled":""}>‹ 이전</button>　<button class="day-switch" id="next" ${n===9?"disabled":""}>다음 ›</button></div></div><h1 class="day-title">DAY ${String(n).padStart(2,"0")}</h1><p class="day-subtitle">${dateFmt(d.date)}　／　${esc(d.region)}</p></div>
  <div class="detail-cover"><img src="${dayImage(d.day)}" alt="${esc(d.region)}"><div class="cover-label"><strong>${esc(d.region)}</strong><span>${esc(d.summary)}</span></div></div>
  <div class="tabs"><button class="tab active" data-tab="schedule">일정</button><button class="tab" data-tab="map">지도</button><button class="tab" data-tab="notes">메모</button></div>
  <section id="schedulePanel"><div class="section-head"><h2>Today's itinerary</h2><small>${d.activities.length} ACTIVITIES</small></div><div class="timeline">${d.activities.map((a,i)=>`<div class="event" data-event="${i}" data-name="${esc(a[1])}"><div class="event-time">${esc(a[0])}</div><div class="event-dot"></div><div><div class="event-title">${esc(a[1])}</div>${a[3]?`<div class="event-note">${esc(a[3])}</div>`:""}<span class="event-tag">${esc(a[2])}</span></div></div>`).join("")}</div></section>
  <section id="mapPanel" class="map-section" hidden><div class="map-head"><h3>Today's route</h3><span>장소를 선택해 위치 확인</span></div><div id="dayMap" class="map-box"><div class="empty-map">지도를 불러오는 중입니다.</div></div><p class="map-help">장소 위치는 지도 검색 결과를 바탕으로 표시됩니다. 정확한 장소가 확인되지 않으면 지도 핀을 생성하지 않습니다.</p><div id="mapPlaceList" class="map-list"></div></section>
  <section id="notesPanel" hidden><div class="section-head"><h2>Travel notes</h2></div>${d.notes?.length?d.notes.map(x=>`<div class="notice">${esc(x)}</div>`).join(""):'<div class="note-card">이 날짜에 별도 메모가 없습니다.</div>'}<div class="note-card">숙소 · ${esc(d.stay)}</div></section>
  <div class="footer-note">DAY ${n} / ${tripData.trip.duration} · MALAYSIA & SINGAPORE</div>`;
  document.getElementById("back").onclick=showOverview;
  document.getElementById("prev").onclick=()=>showDay(Math.max(1,n-1));
  document.getElementById("next").onclick=()=>showDay(Math.min(9,n+1));
  document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  document.querySelectorAll("[data-event]").forEach(el=>el.addEventListener("click",()=>focusPlace(+el.dataset.event)));
  setNav("overview");
}
function dayImage(n){
 const imgs={
  1:"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
  2:"https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80",
  3:"https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
  4:"https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80",
  5:"https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
  6:"https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
  7:"https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80",
  8:"https://images.unsplash.com/photo-1508964942454-1a56651d54ac?auto=format&fit=crop&w=1200&q=80",
  9:"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80"
 };return imgs[n];
}
function switchTab(tab){
 document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 ["schedule","map","notes"].forEach(x=>document.getElementById(x+"Panel").hidden=x!==tab);
 if(tab==="map")initDayMap();
}
function guessCity(d){if(d.day===1||d.day===2||d.day===3)return "Kuala Lumpur, Malaysia";if(d.day===4)return "Langkawi, Malaysia";if(d.day===5)return "Singapore";if(d.day>=6&&d.day<=8)return "Singapore";return "Busan, South Korea"}
function cleanPlaceName(name){
 let s=name.replace(/\s*[·,].*$/,"").replace(/\s*·.*/,"").trim();
 const replacements={"므르데카 광장":"Dataran Merdeka, Kuala Lumpur","바투 동굴":"Batu Caves, Selangor","KLCC 공원, 수리아몰":"Suria KLCC, Kuala Lumpur","살로마 브릿지":"Saloma Link, Kuala Lumpur","잘란 알로 야시장 (석식)":"Jalan Alor, Kuala Lumpur","창캇 부킷 빈탕":"Changkat Bukit Bintang, Kuala Lumpur","파빌리온 (중식, %커피, 랄프 로렌 커피)":"Pavilion Kuala Lumpur","탄중루 맹그로브 투어":"Tanjung Rhu Mangrove Tour, Langkawi","스카이랩 (곤돌라, 스카이 브릿지)":"Langkawi SkyCab, Oriental Village","코코 밸리 (초콜릿 등)":"Coco Valley, Langkawi","옐로우 비치 클럽":"Yellow Beach Cafe, Pantai Cenang, Langkawi","술탄 모스크, 아랍 스트리트, 하지 레인":"Sultan Mosque, Arab Street, Singapore","부기 스트리트":"Bugis Street, Singapore","래플즈 호텔":"Raffles Hotel Singapore","주빌리 브릿지, 멀라이언":"Merlion Park, Singapore","클라크 키, 유람선":"Clarke Quay, Singapore","차이나타운":"Chinatown, Singapore","마리나베이 샌즈 호텔":"Marina Bay Sands, Singapore","플라워 돔, 클라우드 포레스트":"Flower Dome, Gardens by the Bay, Singapore","슈퍼트리 그로브":"Supertree Grove, Gardens by the Bay, Singapore","헬릭스 브릿지":"Helix Bridge, Singapore","센토사섬 케이블카, 스카이 헬릭스, 스카이 루지":"Sentosa Cable Car, Singapore","주얼 창이":"Jewel Changi Airport, Singapore"};
 return replacements[s]||s;
}
function getMappableActivities(d){
 const skip=["이동","조식","중식","석식","기상","취침","체크인","체크아웃","수하물","출발","도착","입국심사","출국심사","자유시간","BTS","BAR","공항","호텔","짐 보관","짐 찾기","취침"];
 return d.activities.map((a,i)=>({a,i})).filter(({a})=>!skip.some(w=>a[1].includes(w)) && !["휴식","항공"].includes(a[2]));
}
async function geocode(q){
 if(geocodeCache[q])return geocodeCache[q];
 try{
  const url="https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q="+encodeURIComponent(q);
  const r=await fetch(url,{headers:{"Accept-Language":"en,ko"}});
  if(!r.ok)return null;const j=await r.json();
  if(!j.length)return null;
  const p={lat:+j[0].lat,lon:+j[0].lon,label:j[0].display_name};geocodeCache[q]=p;return p;
 }catch(e){return null}
}
async function initDayMap(){
 const d=tripData.days.find(x=>x.day===currentDay);if(!d||currentMap)return;
 if(!window.L){document.getElementById("dayMap").innerHTML='<div class="empty-map">지도를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.</div>';return}
 currentMap=L.map("dayMap",{scrollWheelZoom:false}).setView([3.5,101.5],6);
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(currentMap);
 const places=getMappableActivities(d),found=[];
 const list=document.getElementById("mapPlaceList");
 list.innerHTML=places.map(({a,i},k)=>`<div class="map-place"><span class="marker-number">${k+1}</span><span>${esc(a[1])}</span><a class="place-link" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanPlaceName(a[1])+", "+guessCity(d))}">지도 검색 ↗</a></div>`).join("");
 for(let k=0;k<places.length;k++){
  const {a,i}=places[k];const query=cleanPlaceName(a[1])+", "+guessCity(d);
  const p=await geocode(query);
  if(p){found.push({...p,name:a[1],index:i,number:k+1});}
  await new Promise(r=>setTimeout(r,1050));
 }
 if(found.length){
  found.forEach(p=>{
   const icon=L.divIcon({className:"",html:`<div style="width:25px;height:25px;border-radius:50%;background:#a47754;color:#fff;border:2px solid white;box-shadow:0 2px 6px #777;display:grid;place-items:center;font-size:11px;font-weight:700">${p.number}</div>`,iconSize:[25,25],iconAnchor:[12,12]});
   const m=L.marker([p.lat,p.lon],{icon}).addTo(currentMap).bindPopup(`<b>${esc(p.name)}</b><br><a target="_blank" href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}">Google Maps 길찾기 ↗</a>`);
   mapMarkers[p.index]=m;
  });
  if(found.length>1)L.polyline(found.map(p=>[p.lat,p.lon]),{color:"#a47754",weight:3,opacity:.7,dashArray:"5 7"}).addTo(currentMap);
  currentMap.fitBounds(L.latLngBounds(found.map(p=>[p.lat,p.lon])).pad(.18));
 }else{
  currentMap.setView(d.day<=3?[3.139,101.686]:d.day===4?[6.35,99.8]:d.day<=8?[1.352,103.82]:[35.18,128.94],d.day===4?10:12);
  document.getElementById("dayMap").insertAdjacentHTML("beforeend",'<div class="map-help" style="position:absolute;z-index:400;background:#fff;padding:8px;border-radius:8px;margin:10px">정확한 장소 핀을 찾지 못했습니다. 아래 지도 검색 링크를 이용해 주세요.</div>');
 }
 setTimeout(()=>currentMap&&currentMap.invalidateSize(),150);
}
function focusPlace(i){
 const el=document.querySelector(`[data-event="${i}"]`);if(el){document.querySelectorAll(".event").forEach(x=>x.classList.remove("map-focus"));el.classList.add("map-focus");}
 if(currentMap&&mapMarkers[i]){switchTab("map");mapMarkers[i].openPopup();}
}
function showAllMap(){
 activeView="map";destroyMap();
 app.innerHTML=`<div class="detail-top"><button class="back-button" id="back">← 전체 일정</button><h1 class="day-title">Trip Map</h1><p class="day-subtitle">말레이시아 · 싱가포르 · 전체 여행 경로</p></div><div id="allMap" class="all-map"></div><div class="notice">전체 지도는 도시별 개요를 보여줍니다. 정확한 방문 장소는 날짜별 상세 페이지에서 확인할 수 있습니다.</div><div class="day-list">${tripData.days.map(d=>`<button class="day-card" data-day="${d.day}"><div class="day-num"><b>${String(d.day).padStart(2,"0")}</b><span>DAY</span></div><div class="day-info"><strong>${esc(d.region)}</strong><p>${esc(d.summary)}</p></div><span class="arrow">›</span></button>`).join("")}</div>`;
 document.getElementById("back").onclick=showOverview;
 if(window.L){currentMap=L.map("allMap").setView([3.2,101.8],5);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(currentMap);
 const cities=[{n:"쿠알라룸푸르",p:[3.139,101.686]},{n:"랑카위",p:[6.35,99.8]},{n:"싱가포르",p:[1.352,103.82]},{n:"김해",p:[35.18,128.94]}];
 cities.forEach((c,i)=>L.marker(c.p).addTo(currentMap).bindPopup(c.n));
 const line=L.polyline(cities.map(x=>x.p),{color:"#a47754",weight:3,dashArray:"6 8"}).addTo(currentMap);currentMap.fitBounds(line.getBounds().pad(.15));
 }
 document.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>showDay(+b.dataset.day));setNav("map");
}
function showNotes(){activeView="notes";destroyMap();app.innerHTML=`<div class="detail-top"><h1 class="day-title">Travel Notes</h1><p class="day-subtitle">여행 중 확인이 필요한 사항</p></div>${tripData.days.filter(d=>d.notes?.length).map(d=>`<div class="note-card"><b>DAY ${d.day} · ${esc(d.region)}</b><br>${d.notes.map(esc).join("<br>")}</div>`).join("")}<div class="footer-note">UNCONFIRMED ITEMS ARE KEPT AS NOTES</div>`;setNav("notes")}
function setNav(v){document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.nav===v))}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>b.dataset.nav==="overview"?showOverview():b.dataset.nav==="map"?showAllMap():showNotes());
document.getElementById("overviewButton").onclick=showOverview;document.getElementById("homeLink").onclick=e=>{e.preventDefault();showOverview()};
fetch("itinerary.json").then(r=>r.json()).then(d=>{tripData=d;showOverview()}).catch(()=>app.innerHTML='<div class="loading">일정 데이터를 불러오지 못했습니다. data/itinerary.json 파일을 확인해 주세요.</div>');
