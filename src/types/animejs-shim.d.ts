declare module 'animejs/lib/anime.es.js' {
  import type { AnimeInstance, AnimeParams } from 'animejs'
  type AnimeFn = ((params: AnimeParams) => AnimeInstance) & { remove: (targets: any) => void }
  const anime: AnimeFn
  export default anime
}

