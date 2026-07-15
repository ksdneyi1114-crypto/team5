<template>
  <main class="community-page">
    <h1>커뮤니티</h1>

    <p class="description">
      여행 후기와 정보를 자유롭게 공유해보세요.
    </p>

    <div class="top-bar">
      <button @click="writePost">
        글쓰기
      </button>
    </div>

    <!-- 게시글 목록 -->
    <div class="post-list">

      <div
        class="post-card"
        v-for="post in posts"
        :key="post.id"
        @click="openPost(post)"
      >

        <h3>{{ post.title }}</h3>

        <p class="author">
          작성자 : {{ post.author }}
        </p>

        <p class="date">
          {{ post.date }}
        </p>

      </div>

    </div>

    <!-- 게시글 모달 -->
    <PostModal
      :show="showPostModal"
      :post="selectedPost"
      @close="showPostModal = false"
    />

  </main>
</template>

<script setup>
import { ref } from "vue"
import PostModal from "../components/PostModal.vue"

const showPostModal = ref(false)

const selectedPost = ref({})


function openPost(post) {
  selectedPost.value = post
  showPostModal.value = true
}

</script>

<style scoped>

.community-page{
    padding:30px;
}

.description{
    color:#666;
    margin-bottom:20px;
}

.top-bar{
    display:flex;
    justify-content:flex-end;
    margin-bottom:20px;
}

.top-bar button{

    padding:10px 20px;

    border:none;

    background:#141419;

    color:white;

    border-radius:6px;

    cursor:pointer;
}

.post-list{

    display:grid;

    gap:20px;
}

.post-card{

    border:1px solid #ddd;

    border-radius:10px;

    padding:20px;

    cursor:pointer;

    transition:.2s;
}

.post-card:hover{

    transform:translateY(-2px);

    box-shadow:0 4px 12px rgba(0,0,0,.1);
}

.author{

    margin-top:10px;

    color:#666;
}

.date{

    color:#999;

    font-size:14px;
}

</style>