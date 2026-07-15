const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const REQUEST_TIMEOUT_MS = 45_000

function getEnv(name, fallback = '') {
  if (typeof import.meta === 'undefined' || !import.meta.env) return fallback
  return import.meta.env[name] || fallback
}

export function getOpenAIConfig() {
  return {
    apiKey: getEnv('VITE_OPENAI_API_KEY').trim(),
    model: getEnv('VITE_OPENAI_MODEL', 'gpt-5.6-luna').trim(),
  }
}

function extractResponseText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim()
  }

  const texts = []
  for (const item of data?.output || []) {
    if (item?.type !== 'message') continue
    for (const content of item.content || []) {
      if (content?.type === 'output_text' && content.text) texts.push(content.text)
      if (content?.type === 'refusal' && content.refusal) texts.push(content.refusal)
    }
  }
  return texts.join('\n').trim()
}

function makeInstructions(datasetSize) {
  return `당신은 서울 지역 정보 서비스 "마실"의 지역 정보 안내 챗봇입니다.

반드시 다음 규칙을 지키세요.
1. 답변의 장소 사실은 아래에 전달되는 제공 JSON 데이터만 근거로 사용합니다.
2. JSON에 없는 주소, 운영시간, 가격, 휴무일, 행사 날짜, 후기, 편의시설을 만들어내지 않습니다.
3. 데이터가 부족하면 "제공된 데이터에서는 확인할 수 없습니다"라고 분명하게 말합니다.
4. 추천은 질문 조건에 맞는 장소를 최대 5개만 제시합니다.
5. 장소명 뒤에 데이터 ID를 "[ID: 숫자]" 형식으로 붙입니다.
6. 주소가 빈 문자열이면 주소를 추측하지 말고 "주소 정보 없음"이라고 씁니다.
7. 질문이 한국어면 한국어로, 영어면 영어로 답합니다.
8. 답변은 짧은 안내 문장과 번호 목록 위주로 작성합니다.
9. 현재 브라우저에 로드된 데이터는 ${datasetSize}개 장소 레코드입니다.`
}

function makeCurrentInput(question, places, searchAnalysis) {
  const context = {
    searchAnalysis: {
      district: searchAnalysis?.district?.name || null,
      region: searchAnalysis?.regionName || null,
      categories: searchAnalysis?.explicitCategoryNames || [],
      keywords: searchAnalysis?.keywords || [],
    },
    matchedPlaceCount: places.length,
    places,
  }

  return `사용자 현재 질문:\n${question}\n\n질문과 관련해 프론트엔드에서 선별한 제공 JSON 데이터:\n${JSON.stringify(context, null, 2)}`
}

export async function askOpenAI({
  question,
  places,
  searchAnalysis,
  history = [],
  datasetSize = places.length,
}) {
  const { apiKey, model } = getOpenAIConfig()

  if (!apiKey) {
    throw new Error('.env에 VITE_OPENAI_API_KEY가 설정되어 있지 않습니다.')
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const recentHistory = history
    .filter((message) => ['user', 'assistant'].includes(message.role))
    .filter((message) => typeof message.content === 'string' && message.content.trim())
    .slice(-6)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))

  const payload = {
    model,
    instructions: makeInstructions(datasetSize),
    input: [
      ...recentHistory,
      {
        role: 'user',
        content: makeCurrentInput(question, places, searchAnalysis),
      },
    ],
    max_output_tokens: 900,
    store: false,
  }

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data?.error?.message || `OpenAI API 요청 실패 (${response.status})`
      throw new Error(message)
    }

    const output = extractResponseText(data)
    if (!output) throw new Error('OpenAI 응답에서 출력 텍스트를 찾지 못했습니다.')

    return output
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('OpenAI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.')
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}
