import { STATS } from '../data/home-data.js'

const DISTRICTS = [
  { name: '종로구', aliases: ['종로구', '종로', 'jongno', 'jongno-gu'] },
  { name: '중구', aliases: ['중구', 'jung-gu', 'seoul jung'] },
  { name: '용산구', aliases: ['용산구', '용산', 'yongsan', 'yongsan-gu'] },
  { name: '성동구', aliases: ['성동구', '성동', 'seongdong', 'seongdong-gu'] },
  { name: '광진구', aliases: ['광진구', '광진', 'gwangjin', 'gwangjin-gu'] },
  { name: '동대문구', aliases: ['동대문구', '동대문', 'dongdaemun', 'dongdaemun-gu'] },
  { name: '중랑구', aliases: ['중랑구', '중랑', 'jungnang', 'jungnang-gu'] },
  { name: '성북구', aliases: ['성북구', '성북', 'seongbuk', 'seongbuk-gu'] },
  { name: '강북구', aliases: ['강북구', '강북', 'gangbuk', 'gangbuk-gu'] },
  { name: '도봉구', aliases: ['도봉구', '도봉', 'dobong', 'dobong-gu'] },
  { name: '노원구', aliases: ['노원구', '노원', 'nowon', 'nowon-gu'] },
  { name: '은평구', aliases: ['은평구', '은평', 'eunpyeong', 'eunpyeong-gu'] },
  { name: '서대문구', aliases: ['서대문구', '서대문', 'seodaemun', 'seodaemun-gu'] },
  { name: '마포구', aliases: ['마포구', '마포', 'mapo', 'mapo-gu'] },
  { name: '양천구', aliases: ['양천구', '양천', 'yangcheon', 'yangcheon-gu'] },
  { name: '강서구', aliases: ['강서구', '강서', 'gangseo', 'gangseo-gu'] },
  { name: '구로구', aliases: ['구로구', '구로', 'guro', 'guro-gu'] },
  { name: '금천구', aliases: ['금천구', '금천', 'geumcheon', 'geumcheon-gu'] },
  { name: '영등포구', aliases: ['영등포구', '영등포', 'yeongdeungpo', 'yeongdeungpo-gu'] },
  { name: '동작구', aliases: ['동작구', '동작', 'dongjak', 'dongjak-gu'] },
  { name: '관악구', aliases: ['관악구', '관악', 'gwanak', 'gwanak-gu'] },
  { name: '서초구', aliases: ['서초구', '서초', 'seocho', 'seocho-gu'] },
  { name: '강남구', aliases: ['강남구', '강남', 'gangnam', 'gangnam-gu'] },
  { name: '송파구', aliases: ['송파구', '송파', 'songpa', 'songpa-gu'] },
  { name: '강동구', aliases: ['강동구', '강동', 'gangdong', 'gangdong-gu'] },
]

const REGION_ALIASES = [
  ['도심권', '도심', 'city center', 'central seoul'],
  ['동북권', '동북', 'northeast seoul', 'north east seoul'],
  ['서북권', '서북', 'northwest seoul', 'north west seoul'],
  ['서남권', '서남', 'southwest seoul', 'south west seoul'],
  ['동남권', '동남', 'southeast seoul', 'south east seoul'],
]

const CATEGORY_ALIASES = [
  ['관광지', '관광', '명소', 'attraction', 'sightseeing', 'landmark'],
  ['문화시설', '박물관', '미술관', '전시관', '공연장', 'museum', 'gallery', 'culture'],
  ['축제공연행사', '축제', '공연', '행사', 'festival', 'performance', 'event'],
  ['레포츠', '스포츠', '운동', '레저', 'sports', 'leisure', 'activity'],
  ['여행코스', '여행 코스', '코스', 'tour course', 'travel course', 'itinerary'],
  ['쇼핑', '시장', '백화점', '쇼핑몰', 'shopping', 'market', 'mall'],
  ['숙박', '호텔', '모텔', '게스트하우스', 'hotel', 'accommodation', 'lodging'],
  ['음식점', '맛집', '식당', '카페', 'restaurant', 'food', 'cafe', 'café'],
]

const SOFT_CATEGORY_RULES = [
  { aliases: ['데이트', 'date course', 'date spot'], categories: [0, 1, 4] },
  { aliases: ['산책', '걷기', 'walk', 'walking'], categories: [3, 4] },
  { aliases: ['가볼만한 곳', '갈만한 곳', '볼거리', 'places to visit', 'things to do'], categories: [0, 1, 4] },
  { aliases: ['아이와', '가족', 'family', 'kids'], categories: [0, 1, 3] },
  { aliases: ['야경', 'night view'], categories: [0, 4] },
]

const STOP_WORDS = new Set([
  '서울', '서울시', '추천', '추천해줘', '추천해주세요', '알려줘', '알려주세요', '찾아줘',
  '어디', '어디야', '어떤', '뭐가', '무엇', '곳', '장소', '정보', '지역', '근처', '주변',
  '가볼만한', '갈만한', '좋은', '괜찮은', '코스', '여행', '관광', '데이트', '해줘',
  'please', 'recommend', 'show', 'find', 'tell', 'about', 'near', 'nearby', 'place', 'places',
  'seoul', 'good', 'best', 'where', 'what', 'visit',
])

export function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[’'"`]/g, '')
    .replace(/[^0-9a-z가-힣]+/g, ' ')
    .trim()
}

function compact(value = '') {
  return normalizeText(value).replace(/\s+/g, '')
}

function includesAlias(question, alias) {
  const q = normalizeText(question)
  const qCompact = compact(question)
  const a = normalizeText(alias)
  const aCompact = compact(alias)
  return q.includes(a) || qCompact.includes(aCompact)
}

function detectDistrict(question) {
  return DISTRICTS.find((district) =>
    district.aliases.some((alias) => includesAlias(question, alias)),
  ) || null
}

function detectRegion(question) {
  const index = REGION_ALIASES.findIndex((aliases) =>
    aliases.some((alias) => includesAlias(question, alias)),
  )
  return index >= 0 ? index : null
}

function detectExplicitCategories(question) {
  const result = []
  CATEGORY_ALIASES.forEach((aliases, index) => {
    if (aliases.some((alias) => includesAlias(question, alias))) result.push(index)
  })
  return result
}

function detectSoftCategories(question) {
  const result = new Set()
  SOFT_CATEGORY_RULES.forEach((rule) => {
    if (rule.aliases.some((alias) => includesAlias(question, alias))) {
      rule.categories.forEach((category) => result.add(category))
    }
  })
  return [...result]
}

function extractKeywords(question, district, regionIndex, explicitCategories) {
  const ignored = new Set(STOP_WORDS)

  if (district) {
    district.aliases.forEach((alias) => ignored.add(normalizeText(alias)))
    ignored.add(normalizeText(district.name))
  }

  if (regionIndex !== null) {
    REGION_ALIASES[regionIndex].forEach((alias) => ignored.add(normalizeText(alias)))
  }

  explicitCategories.forEach((category) => {
    CATEGORY_ALIASES[category].forEach((alias) => ignored.add(normalizeText(alias)))
  })

  return [...new Set(
    (normalizeText(question).match(/[0-9a-z가-힣]+/g) || [])
      .filter((token) => token.length >= 2)
      .filter((token) => !ignored.has(token)),
  )].slice(0, 8)
}

function placeContainsDistrict(place, district) {
  if (!district) return true
  const searchable = compact(`${place.t || ''} ${place.a || ''} ${place.te || ''}`)
  return district.aliases
    .filter((alias) => /[가-힣]/.test(alias))
    .some((alias) => searchable.includes(compact(alias)))
}

function scorePlace(place, analysis) {
  const title = normalizeText(place.t || '')
  const address = normalizeText(place.a || '')
  const description = normalizeText(place.te || '')
  const titleCompact = compact(place.t || '')
  const questionCompact = compact(analysis.question)

  let score = 0

  if (analysis.district && placeContainsDistrict(place, analysis.district)) score += 30
  if (analysis.regionIndex !== null && Number(place.r) === analysis.regionIndex) score += 22
  if (analysis.explicitCategories.includes(Number(place.c))) score += 18
  if (analysis.softCategories.includes(Number(place.c))) score += 6

  if (titleCompact.length >= 2 && questionCompact.includes(titleCompact)) score += 35

  analysis.keywords.forEach((keyword) => {
    const key = normalizeText(keyword)
    if (title.includes(key)) score += 10
    if (address.includes(key)) score += 8
    if (description.includes(key)) score += 4
  })

  if (place.a) score += 1
  if (place.te) score += 0.5

  return score
}

function toPublicPlace(place) {
  return {
    id: place.i,
    name: place.t || '',
    category: STATS.cats[place.c] || '기타',
    categoryIndex: Number(place.c),
    region: STATS.regions[place.r] || '미분류',
    regionIndex: Number(place.r),
    address: place.a || '',
    latitude: Number.isFinite(Number(place.la)) ? Number(place.la) : null,
    longitude: Number.isFinite(Number(place.ln)) ? Number(place.ln) : null,
    description: place.te || '',
  }
}

export function searchPlaces(places, question, limit = 12) {
  const district = detectDistrict(question)
  const regionIndex = detectRegion(question)
  const explicitCategories = detectExplicitCategories(question)
  const softCategories = detectSoftCategories(question)
  const keywords = extractKeywords(question, district, regionIndex, explicitCategories)

  const analysis = {
    question,
    district,
    regionIndex,
    regionName: regionIndex !== null ? STATS.regions[regionIndex] : null,
    explicitCategories,
    explicitCategoryNames: explicitCategories.map((index) => STATS.cats[index]),
    softCategories,
    keywords,
  }

  let candidates = places.filter((place) => {
    if (district && !placeContainsDistrict(place, district)) return false
    if (regionIndex !== null && Number(place.r) !== regionIndex) return false
    return true
  })

  if (explicitCategories.length > 0) {
    const categoryMatches = candidates.filter((place) =>
      explicitCategories.includes(Number(place.c)),
    )
    if (categoryMatches.length > 0) candidates = categoryMatches
  }

  let ranked = candidates
    .map((place) => ({ place, score: scorePlace(place, analysis) }))
    .sort((a, b) => b.score - a.score || Number(a.place.i) - Number(b.place.i))

  const hasSpecificIntent = Boolean(
    district ||
    regionIndex !== null ||
    explicitCategories.length ||
    softCategories.length ||
    keywords.length,
  )

  if (hasSpecificIntent) {
    const positive = ranked.filter((item) => item.score > 0)
    if (positive.length > 0) ranked = positive
  }

  return {
    analysis,
    places: ranked.slice(0, limit).map(({ place }) => toPublicPlace(place)),
    totalMatched: ranked.length,
  }
}

export function getCategoryName(index) {
  return STATS.cats[index] || '기타'
}

export function getRegionName(index) {
  return STATS.regions[index] || '미분류'
}
