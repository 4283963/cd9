import { App } from './App'

let app: App | null = null

window.addEventListener('DOMContentLoaded', () => {
  app = new App()
  app.start()
})

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose()
    app = null
  }
})
