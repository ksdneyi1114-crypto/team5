// src/data/events.js
export function loadAllEvents() {
  // 더 넓은 패턴으로 모든 JSON을 불러오고, 내부 구조를 로그로 검사합니다.
  const modules = import.meta.glob('../../data/**/*.json', { eager: true });
  const events = [];

  console.info('events: found files', Object.keys(modules).length);

  for (const path in modules) {
    const mod = modules[path];
    const data = (mod && mod.default) ? mod.default : mod;
    console.debug('events: module', path, Object.keys(data || {}));

    // 가능한 items 위치들 체크
    const items = data && (data.items || data.data || (Array.isArray(data) ? data : null));
    if (!items || !Array.isArray(items)) continue;

    for (const it of items) {
      const start = it.eventstartdate || it.eventstart || it.createdtime || '';
      const end = it.eventenddate || it.eventend || it.eventstartdate || it.eventstart || '';
      if (!start) continue;
      events.push({
        id: it.contentid || `${path}-${it.title}`,
        title: it.title || it.name || '(제목 없음)',
        place: it.eventplace || it.addr1 || '',
        startDate: String(start),
        endDate: String(end || start),
        region: data.region || '',
        raw: it
      });
    }
  }

  events.sort((a,b)=>a.startDate.localeCompare(b.startDate));

  console.info('loadAllEvents result', { files: Object.keys(modules).length, events: events.length });
  if (events.length) console.debug('sample event', events[0]);

  return events;
}

export default loadAllEvents();