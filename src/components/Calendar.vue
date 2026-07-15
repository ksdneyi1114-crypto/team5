<template>
  <section class="block calendar">
    <div class="block-head">
      <h2>캘린더</h2>
      <div style="display:flex;gap:8px;align-items:center">
        <button @click="prevMonth">◀</button>
        <div style="min-width:120px;text-align:center;font-weight:800">{{ title }}</div>
        <button @click="nextMonth">▶</button>
      </div>
    </div>

    <div class="calendar-wrap">
      <div class="weekdays">
        <div v-for="d in ['일','월','화','수','목','금','토']" :key="d" class="wd">{{ d }}</div>
      </div>

      <div class="month-grid" ref="gridRef">
        <!-- day cells -->
        <div v-for="(cell, idx) in cells" :key="idx" class="day-cell" :class="{placeholder:!cell.inMonth}">
          <div class="day-num" v-if="cell.inMonth">{{ cell.day }}</div>
        </div>

        <!-- event bars overlay -->
        <div class="bars" :style="barsContainerStyle" aria-hidden="false">
          <div
            v-for="seg in visibleSegments"
            :key="seg.key"
            class="ev-bar"
            :style="[segmentStyle(seg), { background: zoneColor(seg.zone), color: textColor(zoneColor(seg.zone)) }]"
            :title="(seg.zone ? seg.zone + ' · ' : '') + seg.title"
            @click.stop="openEvent(seg.event)"
            role="button"
            tabindex="0"
            @keydown.enter.stop.prevent="openEvent(seg.event)"
          >
            <div class="ev-dot"></div>
            <div class="ev-title">{{ seg.title }}</div>
          </div>

          <!-- "+N more" markers when a week has too many bars to fit its cell -->
          <div
            v-for="m in overflowMarkers"
            :key="m.key"
            class="ev-more"
            :style="markerStyle(m)"
            :title="`이 날 미표시 행사 ${m.count}건 보기`"
            role="button"
            tabindex="0"
            @click.stop="openMarker(m)"
            @keydown.enter.stop.prevent="openMarker(m)"
          >+{{ m.count }}</div>
        </div>
      </div>

      <!-- 권역 색상 범례 -->
      <div class="legend">
        <div class="legend-item" v-for="z in zoneList" :key="z">
          <span class="legend-dot" :style="{background: zoneColor(z)}"></span>{{ z }}
        </div>
      </div>

      <!-- 상시·장기 행사 목록 (달력에 표시하지 않음) -->
      <div class="longrun" v-if="longRunEvents.length">
        <div class="longrun-head">상시 · 장기 공연 및 행사</div>
        <ul class="longrun-list">
          <li v-for="ev in longRunEvents" :key="ev.id" class="longrun-item" @click="openEvent(ev)" role="button" tabindex="0" @keydown.enter.prevent="openEvent(ev)">
            <span class="lr-dot" :style="{background: zoneColor(ev.zone)}"></span>
            <span class="lr-body">
              <span class="lr-title">{{ ev.title }}</span>
              <span class="lr-meta">{{ ev.zone || '서울 외/기타' }} · {{ ev.place || ev.raw?.eventplace || '-' }}</span>
            </span>
            <span class="lr-period">{{ formatYMD(ev.raw?.eventstartdate || ev.raw?.eventstart) }} ~ {{ formatYMD(ev.raw?.eventenddate || ev.raw?.eventend || ev.raw?.eventstartdate) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- modal -->
    <div v-if="selectedEvent" class="modal-overlay" @click.self="closeEvent">
      <div class="modal">
        <button class="modal-close" @click="closeEvent">✕</button>
        <div class="modal-body">
          <div class="modal-left">
            <img v-if="imgSrc(selectedEvent)" :src="imgSrc(selectedEvent)" alt="event image" />
            <div v-else class="no-image">이미지 없음</div>
          </div>
          <div class="modal-right">
            <h3>{{ selectedEvent.title }}</h3>
            <div class="meta">
              <div v-if="selectedEvent.zone">
                <span class="zone-tag" :style="{background: zoneColor(selectedEvent.zone)}">{{ selectedEvent.zone }}</span>
              </div>
              <div><strong>장소:</strong> {{ selectedEvent.place || selectedEvent.raw?.eventplace || '-' }}</div>
              <div><strong>기간:</strong> {{ formatYMD(selectedEvent.raw?.eventstartdate || selectedEvent.raw?.eventstart) }} — {{ formatYMD(selectedEvent.raw?.eventenddate || selectedEvent.raw?.eventend || selectedEvent.raw?.eventstartdate || selectedEvent.raw?.eventstart) }}</div>
              <div v-if="selectedEvent.raw?.usetimefestival"><strong>요금/정보:</strong> {{ selectedEvent.raw.usetimefestival }}</div>
              <div v-if="selectedEvent.raw?.tel"><strong>문의:</strong> {{ selectedEvent.raw.tel }}</div>
            </div>
            <a
              v-if="mapUrl(selectedEvent)"
              class="map-btn"
              :href="mapUrl(selectedEvent)"
              target="_blank"
              rel="noopener noreferrer"
            >구글맵 길찾기</a>
            <p class="program" v-if="selectedEvent.raw?.program">{{ selectedEvent.raw.program }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- day overflow list: 달력에 표시되지 않은 행사 목록 -->
    <div v-if="dayEvents" class="modal-overlay" @click.self="closeDay">
      <div class="day-pop">
        <button class="modal-close" @click="closeDay">✕</button>
        <h3 class="day-pop-title">{{ dayEvents.label }}<span>달력에 표시되지 않은 행사 {{ dayEvents.events.length }}건</span></h3>
        <ul class="day-list">
          <li v-for="ev in dayEvents.events" :key="ev.id" class="day-item" @click="openFromDay(ev)" role="button" tabindex="0" @keydown.enter.prevent="openFromDay(ev)">
            <span class="dl-dot" :style="{background: zoneColor(ev.zone)}"></span>
            <span class="dl-body">
              <span class="dl-title">{{ ev.title }}</span>
              <span class="dl-meta">{{ ev.zone || '서울 외/기타' }} · {{ formatYMD(ev.raw?.eventstartdate || ev.raw?.eventstart) }} ~ {{ formatYMD(ev.raw?.eventenddate || ev.raw?.eventend || ev.raw?.eventstartdate) }}</span>
            </span>
            <span class="dl-go">→</span>
          </li>
        </ul>
      </div>
    </div>

  </section>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

function ymdToDate(s){
  const str = String(s||'');
  if(!/^\d{8}$/.test(str)) return new Date(NaN);
  return new Date(+str.slice(0,4), +str.slice(4,6)-1, +str.slice(6,8));
}
function formatYMD(s){
  const str = String(s||'');
  if(!/^\d{8}$/.test(str)) return str || '-';
  return `${str.slice(0,4)}-${str.slice(4,6)}-${str.slice(6,8)}`;
}

export default {
  name:'Calendar',
  props:{ events:{ type:Array, default:()=>[] } },
  setup(props){
    const now = new Date();
    const year = ref(now.getFullYear());
    const month = ref(now.getMonth()); // 0..11

    const title = computed(()=>`${year.value}년 ${month.value+1}월`);
    function prevMonth(){ if(month.value===0){ month.value=11; year.value-- } else month.value-- }
    function nextMonth(){ if(month.value===11){ month.value=0; year.value++ } else month.value++ }

    const gridRef = ref(null);
    const rowHeight = ref(90); // fallback (cell height + row gap)
    const barsTopOffset = ref(36);
    const barHeight = 22;
    const barGap = 4;
    const gridGap = 6; // must match .month-grid gap
    const barInset = 3; // horizontal padding so bars sit inside the cell

    // how many bar rows fit inside one week cell before we collapse to "+N"
    const maxStack = computed(()=>{
      const rh = rowHeight.value || 90;
      // subtract the row gap so bars never spill past the cell into the next week
      const avail = rh - barsTopOffset.value - barGap - gridGap;
      return Math.max(1, Math.floor(avail / (barHeight + barGap)));
    });

    async function measure() {
      await nextTick();
      const grid = gridRef.value;
      if(!grid) return;
      const firstCell = grid.querySelector('.day-cell');
      if(!firstCell) return;
      const gridStyle = getComputedStyle(grid);
      const rowGap = parseFloat(gridStyle.rowGap || gridStyle.gap) || 6;
      rowHeight.value = firstCell.offsetHeight + rowGap;
      const dayNum = firstCell.querySelector('.day-num');
      barsTopOffset.value = (dayNum ? dayNum.offsetHeight : 16) + 12;
    }

    onMounted(()=>{
      measure();
      window.addEventListener('resize', measure);
    });
    onBeforeUnmount(()=> window.removeEventListener('resize', measure));

    const cells = computed(()=>{
      const first = new Date(year.value, month.value, 1);
      const startWeek = first.getDay();
      const days = new Date(year.value, month.value+1, 0).getDate();
      const total = startWeek + days;
      const rows = Math.ceil(total/7);
      const arr = [];
      for(let i=0;i<rows*7;i++){
        const dayIndex = i - startWeek + 1;
        arr.push({ inMonth: dayIndex>=1 && dayIndex<=days, day: dayIndex });
      }
      return arr;
    });

    const monthMeta = computed(()=>{
      const first = new Date(year.value, month.value, 1);
      const startWeek = first.getDay();
      const days = new Date(year.value, month.value+1, 0).getDate();
      const rows = Math.ceil((startWeek + days)/7);
      return { startWeek, days, rows };
    });

    // 서울 5대 권역: 주소(구)로 분류
    const ZONE_DISTRICTS = {
      '도심권': ['종로구','중구','용산구'],
      '동북권': ['성동구','광진구','동대문구','중랑구','성북구','강북구','도봉구','노원구'],
      '서북권': ['은평구','서대문구','마포구'],
      '서남권': ['양천구','강서구','구로구','금천구','영등포구','동작구','관악구'],
      '동남권': ['서초구','강남구','송파구','강동구'],
    };
    const ZONE_COLOR = { '도심권':'#A8A0E8','동북권':'#9BD4BE','서북권':'#F3C2A0','서남권':'#F0AEC5','동남권':'#A6C1EC' };
    const ZONE_ETC = '#C4C7D0';
    function zoneOf(ev){
      const addr = String(ev?.raw?.addr1 || ev?.place || ev?.raw?.eventplace || '');
      for(const z in ZONE_DISTRICTS){
        if(ZONE_DISTRICTS[z].some(d => addr.includes(d))) return z;
      }
      return '';
    }
    function zoneColor(z){ return ZONE_COLOR[z] || ZONE_ETC; }
    const zoneList = Object.keys(ZONE_DISTRICTS);

    const eventsInMonth = computed(()=>{
      const startOfMonth = new Date(year.value, month.value, 1);
      const endOfMonth = new Date(year.value, month.value+1, 0);
      const list = props.events.map(ev=>{
        const s = ymdToDate(ev.startDate);
        const e = ymdToDate(ev.endDate || ev.startDate);
        if(isNaN(s) || isNaN(e)) return null;
        const sClip = s < startOfMonth ? startOfMonth : s;
        const eClip = e > endOfMonth ? endOfMonth : e;
        if(eClip < startOfMonth || sClip > endOfMonth) return null;
        const startDay = sClip.getDate();
        const endDay = eClip.getDate();
        const zone = zoneOf(ev);
        if(!zone) return null; // 서울 5대 권역이 아니면 표시하지 않음
        const duration = Math.round((e - s) / 86400000) + 1; // 전체 기간(일)
        return { id: ev.id, title: ev.title, region: ev.region, zone, place: ev.place, startDay, endDay, duration, raw: ev.raw || ev };
      }).filter(Boolean);
      // 기간이 짧은 행사를 상위(위쪽)로 노출
      list.sort((a,b)=> a.duration - b.duration || a.startDay - b.startDay);
      return list;
    });

    // 상시·장기 행사(예: 페인터즈)는 달력 바 대신 목록으로 분리
    const LONG_RUN_DAYS = 90;
    const calendarEvents = computed(()=> eventsInMonth.value.filter(e => e.duration <= LONG_RUN_DAYS));
    const longRunEvents = computed(()=> eventsInMonth.value.filter(e => e.duration > LONG_RUN_DAYS));

    // column index (0=Sun .. 6=Sat) for a given day-of-month
    function colOf(day){
      const { startWeek } = monthMeta.value;
      return (startWeek + (day - 1)) % 7;
    }

    // split events into week segments, stack within each week, then collapse overflow
    const layout = computed(()=>{
      const { startWeek, days } = monthMeta.value;
      const segments = [];
      for(const ev of calendarEvents.value){
        let cur = ev.startDay;
        while(cur <= ev.endDay){
          // compute week row and segment end within that week
          const startCellIndex = startWeek + (cur - 1);
          const weekRow = Math.floor(startCellIndex / 7);
          const weekStartCellIndex = weekRow * 7;
          const weekStartDay = weekStartCellIndex - startWeek + 1;
          const weekEndDay = weekStartDay + 6;
          const segStart = cur;
          const segEnd = Math.min(ev.endDay, Math.min(weekEndDay, days));
          segments.push({
            key: `${ev.id}-${weekRow}-${segStart}-${segEnd}`,
            event: ev,
            title: ev.title,
            region: ev.region,
            zone: ev.zone,
            startDay: segStart,
            endDay: segEnd,
            weekRow
          });
          cur = segEnd + 1;
        }
      }

      // assign rowInWeek to avoid overlap per week
      const buckets = {};
      for(const seg of segments){
        const w = seg.weekRow;
        if(!buckets[w]) buckets[w]=[];
        let placed = false;
        for(let r=0;r<20;r++){
          const row = buckets[w][r]||[];
          const conflict = row.some(x=>!(seg.endDay < x.startDay || seg.startDay > x.endDay));
          if(!conflict){
            seg.rowInWeek = r;
            if(!buckets[w][r]) buckets[w][r]=[];
            buckets[w][r].push(seg);
            placed = true;
            break;
          }
        }
        if(!placed) seg.rowInWeek = 0;
      }

      // collapse rows that don't fit the cell into per-day "+N" markers
      const maxV = maxStack.value;
      const weekHasOverflow = {};
      for(const seg of segments){
        if(seg.rowInWeek >= maxV) weekHasOverflow[seg.weekRow] = true;
      }
      const showLimit = {}; // rows actually shown per week (reserve one for the marker)
      const limitFor = (w)=>{
        if(!(w in showLimit)) showLimit[w] = weekHasOverflow[w] ? Math.max(1, maxV - 1) : maxV;
        return showLimit[w];
      };

      const visible = segments.filter(s => s.rowInWeek < limitFor(s.weekRow));
      const hidden = segments.filter(s => s.rowInWeek >= limitFor(s.weekRow));

      // collect hidden events per (week, day) so the "+N" marker can list them
      const byCell = {};
      for(const s of hidden){
        for(let d = s.startDay; d <= s.endDay; d++){
          const k = s.weekRow + '-' + d;
          (byCell[k] || (byCell[k] = [])).push(s.event);
        }
      }
      const markers = Object.keys(byCell).map(k=>{
        const [w, d] = k.split('-').map(Number);
        const evs = byCell[k];
        return { key: 'more-' + k, weekRow: w, day: d, count: evs.length, events: evs, rowInWeek: limitFor(w) };
      });

      return { segments: visible, markers };
    });

    const visibleSegments = computed(()=> layout.value.segments);
    const overflowMarkers = computed(()=> layout.value.markers);

    // position a bar using the 7-column week grid, accounting for the grid gap
    function barPos(weekRow, col, span, rowInWeek){
      const rh = rowHeight.value || 90;
      const top = weekRow * rh + barsTopOffset.value + (rowInWeek || 0) * (barHeight + barGap);
      const totalGap = 6 * gridGap; // 6 gaps across 7 columns
      const left = `calc((100% - ${totalGap}px) / 7 * ${col} + ${col * gridGap + barInset}px)`;
      const width = `calc((100% - ${totalGap}px) / 7 * ${span} + ${(span - 1) * gridGap - 2 * barInset}px)`;
      return { left, width, top: top + 'px', height: barHeight + 'px' };
    }

    function segmentStyle(seg){
      const col = colOf(seg.startDay);
      const span = seg.endDay - seg.startDay + 1;
      return barPos(seg.weekRow, col, span, seg.rowInWeek);
    }

    function markerStyle(m){
      return barPos(m.weekRow, colOf(m.day), 1, m.rowInWeek);
    }

    const barsContainerStyle = computed(()=>{
      const rh = rowHeight.value || 90;
      const totalH = (monthMeta.value.rows * rh) || (rh * 6);
      return { top: '0px', left: '0', right: '0', height: totalH + 'px' };
    });

    // modal
    const selectedEvent = ref(null);
    function openEvent(ev){ selectedEvent.value = { id: ev.id, title: ev.title, place: ev.place, zone: ev.zone, raw: ev.raw }; }
    function closeEvent(){ selectedEvent.value = null; }

    // "+N" 마커 클릭 시 뜨는, 달력에 표시되지 않은 행사 목록 팝업
    const dayEvents = ref(null); // { label, events }
    function openMarker(m){
      dayEvents.value = { label: `${year.value}년 ${month.value+1}월 ${m.day}일`, events: m.events };
    }
    function closeDay(){ dayEvents.value = null; }
    function openFromDay(ev){ dayEvents.value = null; openEvent(ev); }
    function imgSrc(ev){ return ev.raw?.firstimage || ev.raw?.firstimage2 || null; }

    // build a Google Maps directions URL from the event's coords (mapy=lat, mapx=lng)
    function mapUrl(ev){
      const lng = ev?.raw?.mapx;
      const lat = ev?.raw?.mapy;
      if(lat == null || lng == null || lat === '' || lng === '') return null;
      if(isNaN(Number(lat)) || isNaN(Number(lng))) return null;
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }

    function colorForRegion(r){
      const pal = ['#A8A0E8','#9BD4BE','#F3C2A0','#F0AEC5','#A6C1EC'];
      const idx = (typeof r==='number') ? r : (r?Math.abs(hashStr(String(r)))%pal.length:0);
      return pal[idx%pal.length];
    }
    function hashStr(s){ let h=0; for(let i=0;i<s.length;i++) h = (h<<5)-h + s.charCodeAt(i); return h; }
    function textColor(hex){
      if(!hex || hex[0] !== '#') return '#fff';
      const h = hex.replace('#','');
      const full = h.length===3 ? h.split('').map(c=>c+c).join('') : h;
      const bigint = parseInt(full, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 160 ? '#111' : '#fff';
    }

    return {
      title, prevMonth, nextMonth, cells, visibleSegments, overflowMarkers,
      segmentStyle, markerStyle,
      colorForRegion, zoneColor, zoneList, textColor, longRunEvents, selectedEvent, openEvent, closeEvent, formatYMD, imgSrc, mapUrl,
      dayEvents, openMarker, closeDay, openFromDay,
      gridRef, barsContainerStyle
    };
  }
}
</script>

<style>
.calendar .calendar-wrap{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px}
.weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:8px}
.wd{font-weight:800;text-align:center;color:var(--muted);padding:6px 0}
.month-grid{position:relative;display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding-bottom:10px}
.day-cell{min-height:108px;background:transparent;border-radius:8px;border:1px dashed transparent;padding:8px;position:relative}
.day-cell.placeholder{opacity:.25}
.day-num{position:absolute;top:8px;left:8px;font-weight:800;color:var(--ink-soft);font-size:13px;z-index:3}
.bars{position:absolute;left:0;right:0;pointer-events:none;z-index:2}
.ev-bar{position:absolute;box-sizing:border-box;border-radius:6px;padding:2px 8px;display:flex;align-items:center;gap:6px;font-weight:700;pointer-events:auto;overflow:hidden;box-shadow:0 4px 10px rgba(59,58,74,.06);cursor:pointer}
.ev-dot{flex:0 0 auto;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.7)}
.ev-title{font-size:12px;line-height:1;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.ev-more{position:absolute;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:11px;font-weight:800;color:var(--ink-soft);background:var(--line);pointer-events:auto;overflow:hidden;cursor:pointer;transition:background .12s}
.ev-more:hover{background:var(--line-strong)}

/* legend */
.legend{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}
.legend-item{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:var(--ink-soft)}
.legend-dot{width:12px;height:12px;border-radius:4px;flex:0 0 auto}

/* 상시·장기 공연 목록 */
.longrun{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}
.longrun-head{font-weight:800;font-size:14px;color:var(--ink-soft);margin-bottom:10px}
.longrun-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.longrun-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:var(--line);cursor:pointer;transition:background .12s}
.longrun-item:hover{background:var(--line-strong)}
.lr-dot{flex:0 0 auto;width:10px;height:10px;border-radius:50%}
.lr-body{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
.lr-title{font-weight:700;font-size:14px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.lr-meta{font-size:12px;color:var(--muted);white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.lr-period{flex:0 0 auto;font-size:12px;font-weight:700;color:var(--ink-soft)}
@media(max-width:560px){.lr-period{display:none}}

/* modal */
.modal-overlay{position:fixed;inset:0;background:rgba(15,15,20,0.52);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}
.modal{background:var(--surface);border-radius:12px;max-width:920px;width:100%;box-shadow:0 30px 70px rgba(11,11,20,.45);position:relative;overflow:hidden}
.modal-close{position:absolute;right:12px;top:12px;border-radius:8px;background:transparent;border:none;font-size:18px;padding:8px;cursor:pointer}
.modal-body{display:flex;gap:20px;padding:22px}
.modal-left{flex:0 0 360px;display:flex;align-items:center;justify-content:center;background:var(--line-strong);border-radius:8px;overflow:hidden}
.modal-left img{width:100%;height:100%;object-fit:cover}
.no-image{padding:20px;color:var(--muted)}
.modal-right{flex:1;display:flex;flex-direction:column;gap:12px}
.modal-right h3{font-family:var(--serif);font-size:20px;margin:0}
.meta{font-size:14px;color:var(--ink-soft);display:flex;flex-direction:column;gap:6px}
.map-btn{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;background:#A6C1EC;color:#2f2e40;font-weight:800;font-size:14px;text-decoration:none;box-shadow:0 6px 14px rgba(166,193,236,.4);transition:background .15s,transform .05s}
.map-btn:hover{background:#93b2e6}
.map-btn:active{transform:translateY(1px)}
.zone-tag{display:inline-block;padding:3px 10px;border-radius:999px;color:#fff;font-weight:800;font-size:12px}

/* day overflow list popup */
.day-pop{background:var(--surface);border-radius:12px;max-width:420px;width:100%;box-shadow:0 30px 70px rgba(11,11,20,.45);position:relative;padding:20px}
.day-pop-title{font-family:var(--serif);font-size:18px;margin:0 0 12px;display:flex;flex-direction:column;gap:2px}
.day-pop-title span{font-family:inherit;font-size:12px;font-weight:600;color:var(--muted)}
.day-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;max-height:60vh;overflow:auto}
.day-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:var(--line);cursor:pointer;transition:background .12s}
.day-item:hover{background:var(--line-strong)}
.dl-dot{flex:0 0 auto;width:10px;height:10px;border-radius:50%}
.dl-body{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
.dl-title{font-weight:700;font-size:14px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.dl-meta{font-size:12px;color:var(--muted)}
.dl-go{flex:0 0 auto;color:var(--muted);font-weight:800}
.program{white-space:pre-wrap;font-size:13px;color:var(--ink-soft);margin-top:8px;max-height:240px;overflow:auto}

/* responsive */
@media(max-width:880px){
  .modal-body{flex-direction:column}
  .modal-left{flex:0 0 auto;width:100%;height:220px}
}
</style>