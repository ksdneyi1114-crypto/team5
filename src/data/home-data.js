/* ─────────────────────────────────────────────────────────────
 * 마실 · 홈 화면 전용 집계 데이터 (정적 스냅샷)
 * ─────────────────────────────────────────────────────────────
 * 원본 장소 데이터(masil-vite/src/data/masil-data.js, 약 3MB)에서
 * 홈 화면 렌더링에 필요한 집계값만 미리 추출해 둔 파일입니다.
 *   · 지도/캘린더/커뮤니티 기능은 별도 개발 후 git 으로 연결됩니다.
 *   · 그때 원본 데이터가 합류하면 이 스냅샷을 실시간 집계로 교체하면 됩니다.
 * 카테고리 색 · 권역 색은 원본과 동일합니다.
 * ───────────────────────────────────────────────────────────── */

// 카테고리 색 (관광지/문화시설/축제공연행사/레포츠/여행코스/쇼핑/숙박/음식점)
export const CAT_COLOR = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834']

// 권역 색 (도심권/동북권/서북권/서남권/동남권)
export const REGION_COLOR = ['#2f6fd0', '#0c7d55', '#7a52d8', '#c93a63', '#c2551d']

// 서울 생활권 기준 통계
export const STATS = {
  total: 6505,
  cats: ['관광지', '문화시설', '축제공연행사', '레포츠', '여행코스', '쇼핑', '숙박', '음식점'],
  regions: ['도심권', '동북권', '서북권', '서남권', '동남권'],
  bycat: [775, 565, 200, 125, 51, 4367, 422, 0],
  byreg: [1860, 966, 669, 1275, 1735],
}

// 권역 × 카테고리 장소 수 (REGCAT[권역][카테고리])
export const REGCAT = [
  [255, 240, 81, 17, 40, 1034, 193, 0], // 도심권
  [167, 87, 33, 37, 2, 595, 45, 0],     // 동북권
  [82, 50, 11, 16, 2, 433, 75, 0],      // 서북권
  [150, 67, 36, 28, 2, 947, 45, 0],     // 서남권
  [121, 121, 39, 27, 5, 1358, 64, 0],   // 동남권
]

// 권역별 축제·행사 건수
export const FEST_BY_REG = [80, 31, 11, 34, 39]

// 홈 배너(캐러셀): 0=기본 슬라이드, 이후 권역별 대표 명소
export const HERO = [
  { region: '', img: '', place: '' },
  { region: 0, img: 'https://tong.visitkorea.or.kr/cms/resource/81/1075281_image2_1.jpg', place: '경복궁 북쪽마을 북촌 즐기기' },
  { region: 1, img: 'https://tong.visitkorea.or.kr/cms/resource_photo/99/3580599_image2_1.jpg', place: '서울숲' },
  { region: 2, img: 'https://tong.visitkorea.or.kr/cms/resource_photo/23/4063023_image2_1.jpg', place: '하늘공원' },
  { region: 3, img: 'https://tong.visitkorea.or.kr/cms/resource/89/3544389_image2_1.jpg', place: '여의도한강공원' },
  { region: 4, img: 'https://tong.visitkorea.or.kr/cms/resource/94/3584594_image2_1.jpg', place: '롯데월드 아이스링크' },
]
