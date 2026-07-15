<template>
  <div v-if="show" class="overlay" @click="close">

    <div class="modal" @click.stop>

      <button class="close-btn" @click="close">
        ✕
      </button>

      <h2>{{ post.title }}</h2>

      <div class="info">
        <span>작성자 : {{ post.author }}</span>
        <span>작성일 : {{ post.date }}</span>
      </div>

      <hr>

      <div class="content">
        {{ post.content }}
      </div>

      <button class="confirm-btn" @click="close">
        닫기
      </button>

    </div>

  </div>
</template>

<script setup>

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },

  post: {
    type: Object,
    default: () => ({
      title: "",
      author: "",
      date: "",
      content: ""
    })
  }
})

const emit = defineEmits(["close"])

function close() {
  emit("close")
}

</script>

<style scoped>

.overlay{
    position:fixed;
    inset:0;

    background:rgba(0,0,0,.45);

    display:flex;
    justify-content:center;
    align-items:center;

    z-index:1000;
}

.modal{

    width:600px;
    max-width:90%;

    background:white;

    border-radius:10px;

    padding:30px;

    position:relative;

}

.close-btn{

    position:absolute;

    right:15px;

    top:15px;

    border:none;

    background:none;

    font-size:20px;

    cursor:pointer;

}

.info{

    display:flex;

    justify-content:space-between;

    margin:20px 0;

    color:#666;

    font-size:14px;

}

.content{

    min-height:200px;

    line-height:1.8;

    white-space:pre-wrap;

}

.confirm-btn{

    width:100%;

    margin-top:30px;

    padding:10px;

    cursor:pointer;

}

</style>