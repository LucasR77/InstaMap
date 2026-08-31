declare module 'mammoth' {
  export interface MammothMessage {
    type: 'warning' | 'error'
    message: string
  }

  export interface MammothResult {
    value: string
    messages: MammothMessage[]
  }

  export interface MammothOptions {
    styleMap?: string | string[]
    includeDefaultStyleMap?: boolean
    includeEmbeddedStyleMap?: boolean
  }

  export interface MammothInput {
    arrayBuffer?: ArrayBuffer
    buffer?: Buffer
    path?: string
  }

  export function convertToMarkdown(
    input: MammothInput,
    options?: MammothOptions
  ): Promise<MammothResult>

  export function convertToHtml(
    input: MammothInput,
    options?: MammothOptions
  ): Promise<MammothResult>

  export function extractRawText(
    input: MammothInput
  ): Promise<MammothResult>
}
