<template>
  <div id="app">
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
  
  <template v-if="view==='home'">

    <main class="home">    

    <!-- ── 홈 ── -->
    <!--HomeView v-if="view==='home'"-->

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

  </main>
  </template>


  <template v-else-if="view==='comm'">
    <section class="block">
      <!-- 리스트 모드 -->
      <div v-if="commMode==='list'">
        <div class="block-head"><h2>커뮤니티</h2> <button @click="commMode='write'">글쓰기</button></div>
        <div class="post-list">
          <div v-for="p in posts" :key="p.id" class="post-item" @click="readPost(p)">
            <h3>{{ p.title }}</h3>
            <p>{{ p.writer }} | {{ p.date }}</p>
          </div>
        </div>
      </div>
      
      <!-- 글쓰기/수정 모드 -->
      <div v-if="commMode==='write'" class="form-box">

        <div class="form-row">
          <input v-model="form.writer" placeholder="작성자">
          <input
            v-model="form.password"
            type="password"
            placeholder="비밀번호">
        </div>

        <input
          v-model="form.title"
          placeholder="제목을 입력하세요">

        <textarea
          v-model="form.content"
          placeholder="내용을 입력하세요"></textarea>

        <div class="action-bar">
          <button class="btn-solid" @click="savePost">
            {{ form.id ? '수정하기' : '등록하기' }}
          </button>

          <button
            class="btn-ghost"
            @click="commMode='list'">
            취소
          </button>
        </div>
      </div>
      <!-- 읽기 모드 -->
      <div v-if="commMode==='read'" class="read-box">

        <h2>{{ activePost.title }}</h2>

        <div class="read-info">
          {{ activePost.writer }} · {{ activePost.date }}
        </div>

        <div class="post-content">
          {{ activePost.content }}
        </div>

        <div class="password-box">
          <input
            v-model="checkPwd"
            type="password"
            placeholder="수정/삭제 비밀번호">
        </div>

        <div class="action-bar">

          <button class="btn-solid" @click="editPost">
            수정
          </button>

          <button class="btn-danger" @click="deletePost">
            삭제
          </button>

          <button
            class="btn-ghost"
            @click="commMode='list'">
            목록
          </button>

        </div>

      </div>
    </section>
  </template>

  <Calendar
  v-else-if="view === 'cal'"
  :events="EVENTS"
  />
  <!-- ── 지도 ── -->
  <template v-else-if="view==='map'">
    <section class="block map-view" style="padding:20px 0 60px">
      <div class="map-toolbar">
        <select v-model="mapRegion">
          <option value="">전체 권역</option>
          <option v-for="(r,i) in STATS.regions" :key="i" :value="i">{{ r }}</option>
        </select>
        <input class="map-search" placeholder="이름으로 검색..." v-model="query" @input="filterList" />
        <div class="chips" style="margin-left:auto">
          <button :class="{on:categoryFilter===''}" @click="categoryFilter=''">전체</button>
          <button v-for="(c,ci) in STATS.cats" :key="ci" :class="{on:categoryFilter===ci}" @click="categoryFilter=ci">{{ c }}</button>
        </div>
      </div>

      <div class="map-wrap">
        <div id="map"></div>
        <aside class="sidebar">
          <div class="place-list">
            <div class="place-card" v-for="p in filteredPlaces" :key="p.id" @click="flyToPlace(p); openPlace(p)">
              <img :src="p.img" alt="" />
              <div class="pc-body">
                <div class="pc-cat">{{ STATS.cats[p.category] }}</div>
                <div class="pc-title">{{ p.title }}</div>
                <div class="pc-addr">{{ p.address }}</div>
              </div>
            </div>
            <div v-if="filteredPlaces.length===0" style="padding:12px;color:var(--muted)">검색 결과가 없습니다.</div>
          </div>
        </aside>
      </div>

      <teleport to="body">
        <div v-if="activePlace" class="modal-overlay" @click.self="closeModal">
          <div class="modal-card modal-card--centered">
            <div class="modal-content">
              <div class="badge">{{ STATS.cats[activePlace.category] }}</div>
              <h3>{{ activePlace.title }}</h3>
              <div class="meta"><strong>지역</strong> {{ STATS.regions[activePlace.region] }}</div>
              <div class="meta"><strong>주소</strong> {{ activePlace.address }}</div>
              <p class="desc">{{ activePlace.desc }}</p>
              <div style="margin-top:14px"><button class="btn btn-solid" @click="closeModal">지도앱에서 길찾기</button></div>
            </div>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
        </div>
      </teleport>
    </section>
  </template>

  <!-- ── 준비 중 ── -->
  <section class="soon" v-else>
    <div class="soon-inner">
      <h2>{{ SOON[view].title }}</h2>
      <p>{{ SOON[view].desc }}</p>
      <button class="btn btn-ghost" @click="go('home')">← 홈으로 돌아가기</button>
    </div>
  </section>

  </div>
</template>

<style scoped>
/* 커뮤니티 전용 스타일 추가 */
.comm-page { max-width: 600px; margin: 0 auto; padding: 20px; }
.post-item { padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; }
.post-item:hover { background: #f9f9f9; }
.p-info { font-size: 0.85rem; color: #888; margin-bottom: 5px; }
.post-content { white-space: pre-wrap; line-height: 1.6; padding: 20px 0; min-height: 150px; }
.form-box input, .form-box textarea { width: 100%; margin-bottom: 10px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; }
.action-bar { display: flex; gap: 10px; align-items: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
.danger { color: #ff4d4f; }
.btn-solid { background: #A8A0E8; color: white; padding: 8px 16px; border-radius: 20px; border: none; cursor: pointer; }
.btn-ghost { background: transparent; border: 1px solid #ddd; padding: 8px 16px; border-radius: 20px; cursor: pointer; }
</style>

<script>
import { STATS, REGCAT, FEST_BY_REG, CAT_COLOR } from './data/home-data.js'
import Calendar from './components/Calendar.vue'
import Community from './components/Community.vue'
import PLACES from './data/masil-data-seoul.js'
import * as L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import ChatWidget from './components/ChatWidget.vue'
import EVENTS from './data/events.js' // 있으면 불러오고, 없으면 이후 파일 생성하세요

const CAT_PAL = ['#A8A0E8', '#9BD4BE', '#F3C2A0', '#F0AEC5', '#B7A7E6', '#A6C1EC', '#F1B4A6', '#BFD59C']
const REG_PAL = ['#A8A0E8', '#9BD4BE', '#F3C2A0', '#F0AEC5', '#A6C1EC']

export default {
  name: 'App',
  components: { ChatWidget,Calendar, Community },
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
      home:{title:'홈', desc:'홈입니다'},
      map:{title:'지도', desc:'서울 6,505곳을 카테고리별 색으로 한눈에 보고, 권역·종류로 걸러 찾는 지도 기능입니다.'},
      cal:{title:'캘린더', desc:'날짜가 있는 축제·행사를 달력에 펼쳐, 이번 주말 무엇이 열리는지 바로 확인하는 기능입니다.'},
      comm:{title:'커뮤니티', desc:'로그인 없이 익명으로 지역 이야기를 나누고, 비밀번호로 내 글을 수정·삭제하는 게시판입니다.'},
    },
    catRegion:'', animBar:false,
    EVENTS, // expose EVENTS to template as prop for Calendar

    activePost: {
      title: '',
      writer: '',
      date: '',
      content: '',
      password: ''
    },

    posts: [],
    commMode: 'list',
    checkPwd: '',
    form:{
      id:null,
      title:'',
      writer:'',
      password:'',
      content:''
    },

    // map state
    cluster: null,
  
    map: null,
    mapInitialized: false,
    markers: [],
    places: PLACES.map(p=>({
      id: p.i,
      title: p.t,
      category: p.c,
      region: p.r,
      lat: p.la,
      lng: p.ln,
      img: p.im || '',
      address: p.a || '',
      desc: p.te || ''
    })),
    filteredPlaces: PLACES.map(p=>({
      id: p.i,
      title: p.t,
      category: p.c,
      region: p.r,
      lat: p.la,
      lng: p.ln,
      img: p.im || '',
      address: p.a || '',
      desc: p.te || ''
    })),
    query: '',
    mapRegion: '',
    categoryFilter: '',
    activePlace: null,
  }
},

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

    initMap(){ 
      if(this.mapInitialized) return;
      this.mapInitialized = true;
      this.map = L.map('map', { center:[37.5665,126.9780], zoom:20 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(this.map);
      this.drawMarkers();
      this.map.on("moveend", () => {
      this.drawMarkers();
    });

    this.map.on("zoomend", () => {
      this.drawMarkers();
    });
      // close modal when map clicked
      this.map.on('click', ()=>{ this.activePlace = null; });
      setTimeout(()=>{ if(this.map) this.map.invalidateSize(); },200);
    },

    drawMarkers() {
      if (!this.map) return;

      this.clearMarkers();

      // 현재 지도에 보이는 영역
      const bounds = this.map.getBounds();

      // 현재 화면 안에 있는 장소만 선택
      const visiblePlaces = this.filteredPlaces.filter(p =>
        bounds.contains([p.lat, p.lng])
      );

      console.log(
        `전체 ${this.filteredPlaces.length}개 / 현재 화면 ${visiblePlaces.length}개`
      );

      visiblePlaces.forEach(p => {
        const color =
          CAT_COLOR && CAT_COLOR[p.category]
            ? CAT_COLOR[p.category]
            : "#2a78d6";

        const marker = L.circleMarker(
          [p.lat, p.lng],
          {
            radius: 8,
            fillColor: color,
            color: "#fff",
            weight: 1,
            fillOpacity: 1,
          }
        ).addTo(this.map);

        marker.on("click", () => {
          this.openPlace(p);
        });

        this.markers.push(marker);
      });
    },

    clearMarkers(){ if(!this.map) return; this.markers.forEach(m=>this.map.removeLayer(m)); this.markers = []; },

    flyToPlace(p) {
      if (!this.map) this.initMap();

      this.map.setView([p.lat, p.lng], 13, {
        animate: true,
      });

      this.drawMarkers();
    },

    openPlace(p){ this.activePlace = p; },

    closeModal(){ this.activePlace = null; },

    filterList(){
      const q = (this.query||'').trim().toLowerCase();
      this.filteredPlaces = this.places.filter(p=>{
        if(this.categoryFilter!=='' && p.category!==this.categoryFilter) return false;
        if(this.mapRegion!=='' && p.region!==Number(this.mapRegion)) return false;
        if(q && !(p.title.toLowerCase().includes(q) || (p.address||'').toLowerCase().includes(q))) return false;
        return true;
      });
      this.drawMarkers();
    },

    handleChatOpenPlace(id){
      const p = this.places.find(x=>x.id===id)
      if(!p) return
      this.go('map')
      this.$nextTick(()=>{
        this.initMap()
        this.flyToPlace(p)
        this.openPlace(p)
      })
    },

    // modal shows detail card while the main map remains visible in the background

  },
  

    savePost(){
      if(this.form.id){ // 수정
        const idx = this.posts.findIndex(p => p.id === this.form.id);
        this.posts[idx] = { ...this.form };
      } else { // 신규
        this.posts.unshift({ ...this.form, id:Date.now(), date:new Date().toLocaleDateString() });
      }
      this.commMode = 'list';
      this.form = { id:null, title:'', writer:'', password:'', content:'' };
    },
    readPost(p){ this.activePost = p; this.commMode = 'read'; },
    editPost(){
      if(this.activePost.password === this.checkPwd){
        this.form = { ...this.activePost };
        this.commMode = 'write';
      } else alert('비밀번호 불일치');
    },
    deletePost(){
      if(this.activePost.password === this.checkPwd){
        this.posts = this.posts.filter(p => p.id !== this.activePost.id);
        this.commMode = 'list';
      } else alert('비밀번호 불일치');
    },
  

  watch:{
    view(nv){ if(nv==='map'){ this.$nextTick(()=>{ this.initMap(); }); } },
    categoryFilter(){ this.filterList(); },
    mapRegion(){ this.filterList(); },
  },


  mounted(){ setTimeout(()=>{ this.animBar=true; },250); },
}
</script>
