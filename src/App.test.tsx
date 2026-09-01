import { describe, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { App } from './App'

describe('App render test', () => {
  it('renders App without crashing', () => {
    try {
      const html = renderToString(<App />)
      console.log('Rendered HTML length:', html.length)
    } catch (e) {
      console.error('CRASH DURING RENDER:', e)
      throw e
    }
  })
})
