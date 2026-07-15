<template>
  <div class="page" v-cloak>

    <!-- 상단 네비 -->
    <header class="topbar">
      <div class="brand" @click="go('home')">
        <span class="brand-dot"></span>
        <span class="brand-text">
          <span class="brand-name">마실</span>
          <span class="brand-tagline">로그인 없는 지역 나들이</span>
        </span>
      </div>
      <nav class="nav">
        <button v-for="n in NAV" :key="n.k" class="nav-link" :class="{on:view===n.k}" @click="go(n.k)">{{ n.label }}</button>
      </nav>
    </header>

    <!-- ── 홈 ── -->
    <template v-if="view==='home'">

      <!-- 히어로 -->
      <section class="hero">
        <div class="kicker">계정 없이 · 알고리즘 없이 · 그냥 지도로</div>
        <h1>동네 이야기는 피드가 아니라<br><em>지도</em>에 있어야 합니다.</h1>
        <p>가볼 곳·축제·맛집 정보가 SNS 계정과 알고리즘 안에 갇혀 있어요.
           마실은 <b>로그인도, 팔로우도 필요 없이</b> 서울 곳곳의 정보를 지도와 달력으로 펼쳐 봅니다.</p>
        <div class="cta">
          <button class="btn btn-solid" @click="go('map')">지도로 둘러보기</button>
          <button class="btn btn-ghost" @click="go('cal')">축제 일정 보기</button>
        </div>
      </section>

      <!-- 통계 -->
      <section class="stats">
        <div class="stat"><div class="s-n">{{ STATS.total.toLocaleString() }}</div><div class="s-l">등록된 장소</div></div>
        <div class="stat"><div class="s-n">{{ STATS.regions.length }}</div><div class="s-l">개 생활권</div></div>
        <div class="stat"><div class="s-n">{{ STATS.cats.length }}</div><div class="s-l">개 카테고리</div></div>
        <div class="stat"><div class="s-n">0</div><div class="s-l">필요한 로그인</div></div>
      </section>

      <!-- 매니페스토 -->
      <section class="manifesto">
        <div class="mf-block">
          <h2>지역 정보가 SNS 안에 갇혀 있습니다.</h2>
          <p>동네 정보를 찾거나 경험을 공유하려면 인스타그램이나 블로그 같은 SNS를 이용해야 합니다.
             로그인과 알고리즘이 전제되는 구조라, SNS를 사용하지 않으면 정보를 찾기도 나누기도 쉽지 않습니다.</p>
        </div>
        <div class="mf-block">
          <h2>로그인 없는 공용 공간</h2>
          <p>계정 생성이나 피드에 지칠 필요 없습니다. 누구나 지역 정보를 확인하고 익명으로 경험을 공유할 수 있는
             가장 가벼운 지역 커뮤니티입니다.</p>
        </div>
      </section>

      <!-- 카테고리 랭킹 -->
      <section class="block">
        <div class="block-head">
          <h2>카테고리별 장소</h2>
          <div class="chips">
            <button :class="{on:catRegion===''}" @click="catRegion=''">서울 전체</button>
            <button v-for="(r,i) in STATS.regions" :key="i" :class="{on:catRegion===i}" @click="catRegion=i">{{ r }}</button>
          </div>
        </div>
        <div class="rank">
          <div class="rank-row" v-for="c in catRanking" :key="c.i">
            <span class="rk-name">{{ c.name }}</span>
            <span class="rk-track"><span class="rk-fill" :style="{width:(animBar?c.count/maxCat*100:0)+'%',background:c.color}"></span></span>
            <span class="rk-val">{{ c.count.toLocaleString() }}<em>{{ c.pct }}%</em></span>
          </div>
        </div>
      </section>

      <!-- 권역 카드 (사진 없이 색면) -->
      <section class="block">
        <div class="block-head"><h2>권역별 둘러보기</h2></div>
        <div class="region-grid">
          <button class="rcard" v-for="(r,i) in feats" :key="i" @click="go('map')" :style="{'--rc':REG_PAL[i]}">
            <span class="rc-top"></span>
            <span class="rc-name">{{ r.name }}</span>
            <span class="rc-nums"><b>{{ r.count.toLocaleString() }}</b>곳 · 축제 {{ r.fest }}건</span>
          </button>
        </div>
      </section>

      <!-- 기능 -->
      <section class="block features">
        <div class="block-head"><h2>무엇을 할 수 있나요</h2></div>
        <button class="ft-row" v-for="f in FEATURES" :key="f.k" @click="go(f.k)">
          <span class="ft-txt">
            <span class="ft-title">{{ f.title }}</span>
            <span class="ft-desc">{{ f.desc }}</span>
          </span>
          <span class="ft-go">→</span>
        </button>
      </section>


    </template>

    <!-- 캘린더 또는 준비중 화면 -->
    <template v-else>
      <Calendar v-if="view==='cal'" :events="EVENTS" />
      <section class="soon" v-else>
        <div class="soon-inner">
          <h2>{{ SOON[view].title }}</h2>
          <p>{{ SOON[view].desc }}</p>
          <div class="soon-badge">🚧 준비 중 · 별도 개발 후 홈 화면과 연결됩니다</div>
          <button class="btn btn-ghost" @click="go('home')">← 홈으로 돌아가기</button>
        </div>
      </section>
    </template>

  </div>
</template>

<script>
import { STATS, REGCAT, FEST_BY_REG } from './data/home-data.js'
import Calendar from './components/Calendar.vue'
import EVENTS from './data/events.js' // 있으면 불러오고, 없으면 이후 파일 생성하세요

const CAT_PAL = ['#A8A0E8', '#9BD4BE', '#F3C2A0', '#F0AEC5', '#B7A7E6', '#A6C1EC', '#F1B4A6', '#BFD59C']
const REG_PAL = ['#A8A0E8', '#9BD4BE', '#F3C2A0', '#F0AEC5', '#A6C1EC']

export default {
  name: 'App',
  components: { Calendar },
  data(){ return {
    view:'home', STATS, REG_PAL,
    NAV:[
      {k:'home', label:'홈'},
      {k:'map',  label:'지도'},
      {k:'cal',  label:'캘린더'},
      {k:'comm', label:'커뮤니티'},
    ],
    FEATURES:[
      {k:'map',  title:'지도', desc:'서울 6,505곳을 카테고리별 색으로 한눈에. 권역·종류로 걸러 찾아보세요.'},
      {k:'cal',  title:'캘린더', desc:'날짜가 있는 축제·행사를 달력에 펼쳐서. 이번 주말 뭐가 열리는지 바로.'},
      {k:'comm', title:'커뮤니티', desc:'로그인 없이 익명으로. 비밀번호로 내 글을 수정·삭제해요.'},
    ],
    SOON:{
      map:{title:'지도', desc:'서울 6,505곳을 카테고리별 색으로 한눈에 보고, 권역·종류로 걸러 찾는 지도 기능입니다.'},
      cal:{title:'캘린더', desc:'날짜가 있는 축제·행사를 달력에 펼쳐, 이번 주말 무엇이 열리는지 바로 확인하는 기능입니다.'},
      comm:{title:'커뮤니티', desc:'로그인 없이 익명으로 지역 이야기를 나누고, 비밀번호로 내 글을 수정·삭제하는 게시판입니다.'},
    },
    catRegion:'', animBar:false,
    EVENTS // expose EVENTS to template as prop for Calendar
  }},
  computed:{
    feats(){ return STATS.regions.map((name,ri)=>({ name, count:STATS.byreg[ri], fest:FEST_BY_REG[ri] })); },
    catCounts(){ return this.catRegion===''?STATS.bycat:REGCAT[this.catRegion]; },
    catTotal(){ return this.catCounts.reduce((a,b)=>a+b,0); },
    catRanking(){
      return this.catCounts
        .map((count,i)=>({i, name:STATS.cats[i], color:CAT_PAL[i], count}))
        .filter(c=>c.count>0)
        .sort((a,b)=>b.count-a.count)
        .map(c=>({...c, pct:(c.count/(this.catTotal||1)*100).toFixed(1)}))
    },
    maxCat(){ return Math.max(...this.catCounts, 1); },
  },
  methods:{
    go(v){ this.view=v; window.scrollTo({top:0,behavior:'smooth'}); },
  },
  mounted(){ setTimeout(()=>{ this.animBar=true; },250); },
}
</script>