<template>
  <teleport to="body">
    <div class="chat-root">
      <button
        v-if="!open"
        class="chat-fab"
        type="button"
        aria-label="마실 도우미 열기"
        @click="openChat"
      >
        <img v-if="chatImg" :src="chatImg" alt="" class="fab-img" />
        <span v-else class="fab-fallback">🤖</span>
      </button>

      <section v-else class="chat-panel" aria-label="마실 지역 정보 챗봇">
        <header class="chat-header">
          <div class="chat-header-left">
            <img v-if="chatImg" :src="chatImg" alt="" class="header-avatar" />
            <span v-else class="header-avatar header-avatar--fallback">🤖</span>
            <div>
              <h2 class="chat-title">마실 도우미</h2>
              <p class="chat-sub">
                <span class="status-dot" :class="{ ready: apiConfigured }"></span>
                {{ apiConfigured ? '제공 데이터 + OpenAI' : 'API 키 설정 필요' }}
              </p>
            </div>
          </div>

          <div class="chat-actions">
            <button type="button" class="header-button" title="대화 초기화" @click="clearHistory">🗑</button>
            <button type="button" class="header-button" title="닫기" @click="open = false">✕</button>
          </div>
        </header>

        <main ref="bodyRef" class="chat-body">
          <div v-if="messages.length === 0" class="chat-empty">
            <strong>서울 지역 정보를 물어보세요.</strong>
            <span>예: 종로구 가볼 만한 곳, 강남 데이트 코스, Jongno restaurants</span>
            <span class="data-note">현재 로드된 장소 데이터: {{ PLACES.length }}개</span>
          </div>

          <article
            v-for="message in messages"
            :key="message.id"
            class="msg-row"
            :class="message.role"
          >
            <div class="msg-bubble" :class="{ error: message.error }">
              <p class="message-text">{{ message.content }}</p>

              <div v-if="message.placeIds?.length" class="result-list">
                <button
                  v-for="placeId in message.placeIds"
                  :key="placeId"
                  type="button"
                  class="place-result"
                  @click="openPlace(placeId)"
                >
                  <strong>{{ getPlace(placeId)?.t }}</strong>
                  <span>{{ formatPlaceMeta(getPlace(placeId)) }}</span>
                  <em>지도에서 보기 →</em>
                </button>
              </div>
            </div>
          </article>

          <article v-if="loading" class="msg-row assistant">
            <div class="msg-bubble loading-bubble">
              <span></span><span></span><span></span>
            </div>
          </article>
        </main>

        <form class="chat-footer" @submit.prevent="submitMessage">
          <input
            v-model="text"
            type="text"
            maxlength="500"
            autocomplete="off"
            :disabled="loading"
            placeholder="지역 정보 질문을 입력하세요"
          />
          <button type="submit" class="btn-send" :disabled="!canSubmit">전송</button>
        </form>

        <p v-if="!apiConfigured" class="config-warning">
          프로젝트 루트의 <code>.env</code>에 <code>VITE_OPENAI_API_KEY</code>를 설정한 뒤 개발 서버를 다시 실행하세요.
        </p>
      </section>
    </div>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import PLACES from '../data/masil-data.js'
import { STATS } from '../data/home-data.js'
import { askOpenAI, getOpenAIConfig } from '../utils/openai.js'
import { searchPlaces } from '../utils/placeSearch.js'

const emit = defineEmits(['chat-open-place'])

const STORAGE_KEY = 'masil_chat_history_v2'
const open = ref(false)
const text = ref('')
const messages = ref([])
const loading = ref(false)
const bodyRef = ref(null)
const chatImg = ref('')

const apiConfigured = computed(() => Boolean(getOpenAIConfig().apiKey))
const canSubmit = computed(() => Boolean(text.value.trim()) && !loading.value)

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function openChat() {
  open.value = true
  scrollToBottom()
}

function getPlace(id) {
  return PLACES.find((place) => Number(place.i) === Number(id)) || null
}

function formatPlaceMeta(place) {
  if (!place) return ''
  const category = STATS.cats[place.c] || '기타'
  const address = place.a || '주소 정보 없음'
  return `${category} · ${address}`
}

function openPlace(id) {
  emit('chat-open-place', Number(id))
}

function scrollToBottom() {
  nextTick(() => {
    if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  })
}

function clearHistory() {
  if (!window.confirm('챗봇 대화를 모두 지울까요?')) return
  messages.value = []
  localStorage.removeItem(STORAGE_KEY)
}

function makeLocalFallback(result, errorMessage) {
  if (result.places.length === 0) {
    return `${errorMessage}\n\n제공된 JSON 데이터에서도 질문 조건과 일치하는 장소를 찾지 못했습니다.`
  }

  const names = result.places
    .slice(0, 5)
    .map((place, index) => `${index + 1}. ${place.name}${place.address ? ` — ${place.address}` : ' — 주소 정보 없음'}`)
    .join('\n')

  return `${errorMessage}\n\n대신 제공된 JSON 데이터에서 다음 장소를 찾았습니다.\n${names}`
}

async function submitMessage() {
  const question = text.value.trim()
  if (!question || loading.value) return

  const history = messages.value.map(({ role, content }) => ({ role, content }))
  messages.value.push({
    id: makeId(),
    role: 'user',
    content: question,
  })

  text.value = ''
  loading.value = true
  scrollToBottom()

  const result = searchPlaces(PLACES, question, 12)
  const visiblePlaceIds = result.places.slice(0, 5).map((place) => place.id)

  try {
    const answer = await askOpenAI({
      question,
      places: result.places,
      searchAnalysis: result.analysis,
      history,
      datasetSize: PLACES.length,
    })

    messages.value.push({
      id: makeId(),
      role: 'assistant',
      content: answer,
      placeIds: visiblePlaceIds,
    })
  } catch (error) {
    const reason = error?.message || 'OpenAI API 호출 중 알 수 없는 오류가 발생했습니다.'
    messages.value.push({
      id: makeId(),
      role: 'assistant',
      content: makeLocalFallback(result, `OpenAI 호출 오류: ${reason}`),
      placeIds: visiblePlaceIds,
      error: true,
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

onMounted(async () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) messages.value = parsed
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  try {
    const response = await fetch('/chatbot.png', { method: 'HEAD' })
    if (response.ok) chatImg.value = '/chatbot.png'
  } catch {
    chatImg.value = ''
  }
})

watch(
  messages,
  (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)),
  { deep: true },
)
</script>

<style scoped>
.chat-root {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 1200;
}

.chat-fab {
  width: 58px;
  height: 58px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #2f6fd0;
  box-shadow: 0 10px 26px rgba(47, 111, 208, 0.35);
  cursor: pointer;
  overflow: hidden;
}

.fab-img,
.fab-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  object-fit: cover;
  font-size: 26px;
}

.chat-panel {
  width: min(390px, calc(100vw - 28px));
  height: min(650px, calc(100vh - 40px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e7eaf0;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(27, 39, 66, 0.2);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  color: #fff;
  background: #2f6fd0;
}

.chat-header-left,
.chat-actions {
  display: flex;
  align-items: center;
}

.chat-header-left {
  gap: 10px;
}

.header-avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  object-fit: cover;
  background: #fff;
}

.header-avatar--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #222;
  font-size: 21px;
}

.chat-title,
.chat-sub {
  margin: 0;
}

.chat-title {
  font-size: 16px;
  line-height: 1.3;
}

.chat-sub {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.9;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ffca66;
}

.status-dot.ready {
  background: #7cf0a7;
}

.chat-actions {
  gap: 6px;
}

.header-button {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 9px;
  color: #fff;
  background: rgba(255, 255, 255, 0.13);
  cursor: pointer;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  background: #f6f8fb;
}

.chat-empty {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 18px;
  color: #596273;
  text-align: center;
  line-height: 1.5;
}

.chat-empty strong {
  color: #252b36;
}

.data-note {
  font-size: 12px;
  color: #8a93a3;
}

.msg-row {
  display: flex;
  margin-bottom: 11px;
}

.msg-row.user {
  justify-content: flex-end;
}

.msg-row.assistant {
  justify-content: flex-start;
}

.msg-bubble {
  max-width: 86%;
  padding: 11px 13px;
  border: 1px solid #e7eaf0;
  border-radius: 15px 15px 15px 5px;
  color: #252b36;
  background: #fff;
  box-shadow: 0 4px 12px rgba(31, 42, 68, 0.05);
}

.msg-row.user .msg-bubble {
  border-color: #2f6fd0;
  border-radius: 15px 15px 5px 15px;
  color: #fff;
  background: #2f6fd0;
}

.msg-bubble.error {
  border-color: #f0c6c6;
  background: #fff8f8;
}

.message-text {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.55;
  font-size: 14px;
}

.result-list {
  display: grid;
  gap: 7px;
  margin-top: 10px;
}

.place-result {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  padding: 9px 10px;
  border: 1px solid #dfe7f5;
  border-radius: 10px;
  text-align: left;
  color: #252b36;
  background: #f8fbff;
  cursor: pointer;
}

.place-result:hover {
  border-color: #9bb9ea;
  background: #eef5ff;
}

.place-result strong {
  font-size: 13px;
}

.place-result span,
.place-result em {
  font-size: 11px;
  font-style: normal;
  color: #6f7888;
}

.place-result em {
  color: #2f6fd0;
}

.loading-bubble {
  display: flex;
  gap: 4px;
  padding: 14px 16px;
}

.loading-bubble span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8a93a3;
  animation: bounce 1s infinite ease-in-out;
}

.loading-bubble span:nth-child(2) { animation-delay: 0.12s; }
.loading-bubble span:nth-child(3) { animation-delay: 0.24s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); }
}

.chat-footer {
  display: flex;
  gap: 8px;
  padding: 11px;
  border-top: 1px solid #e7eaf0;
  background: #fff;
}

.chat-footer input {
  min-width: 0;
  flex: 1;
  padding: 10px 11px;
  border: 1px solid #d9dee8;
  border-radius: 10px;
  outline: none;
}

.chat-footer input:focus {
  border-color: #759de0;
  box-shadow: 0 0 0 3px rgba(47, 111, 208, 0.1);
}

.btn-send {
  padding: 0 15px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  background: #2f6fd0;
  cursor: pointer;
}

.btn-send:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.config-warning {
  margin: 0;
  padding: 8px 11px;
  border-top: 1px solid #f0dca9;
  color: #765713;
  background: #fff8df;
  font-size: 11px;
  line-height: 1.45;
}

.config-warning code {
  font-size: inherit;
}

@media (max-width: 520px) {
  .chat-root {
    right: 10px;
    bottom: 10px;
  }

  .chat-panel {
    width: calc(100vw - 20px);
    height: calc(100vh - 20px);
  }
}
</style>
