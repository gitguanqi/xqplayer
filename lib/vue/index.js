import videoComponent from './index.vue'

const xqVideo = {
    install: function (Vue) {  
        Vue.component('xqVideo', videoComponent)
    }
}

export default xqVideo;
