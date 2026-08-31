export type AppTheme = 'dark' | 'light'

export interface ThemeConfig {
  theme: AppTheme
  canvasBackground: 'dots' | 'lines' | 'cross'
  nodeStyle: 'glass' | 'solid' | 'minimal'
}
