// Flexoki (https://stephango.com/flexoki) dark syntax theme for Shiki.
// Code blocks are dark in both site themes, so one theme serves both.
const c = {
  fg: '#cecdc3',
  comment: '#878580',
  red: '#d14d41',
  orange: '#da702c',
  yellow: '#d0a215',
  green: '#879a39',
  cyan: '#3aa99f',
  blue: '#4385be',
  purple: '#8b7ec8',
  magenta: '#ce5d97'
}

const rule = (scope: string[], foreground: string, fontStyle?: string) => ({
  scope,
  settings: fontStyle ? { foreground, fontStyle } : { foreground }
})

export const flexoki = {
  name: 'flexoki',
  type: 'dark' as const,
  colors: { 'editor.background': '#100f0f', 'editor.foreground': c.fg },
  settings: [{ settings: { foreground: c.fg, background: '#100f0f' } }],
  tokenColors: [
    rule(['comment', 'punctuation.definition.comment'], c.comment, 'italic'),
    rule(['keyword', 'storage', 'storage.type', 'keyword.control'], c.green),
    rule(['string', 'string.quoted', 'punctuation.definition.string'], c.cyan),
    rule(['constant.numeric', 'constant.language', 'constant.character.escape'], c.purple),
    rule(['entity.name.function', 'support.function', 'meta.function-call'], c.orange),
    rule(['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'storage.type.built-in'], c.yellow),
    rule(['variable', 'variable.other', 'variable.parameter'], c.blue),
    rule(['meta.preprocessor', 'keyword.control.directive', 'entity.name.function.preprocessor'], c.magenta),
    rule(['punctuation', 'keyword.operator', 'meta.brace'], '#b7b5ac'),
    rule(['entity.name.tag', 'markup.deleted', 'invalid'], c.red),
    rule(['entity.other.attribute-name', 'support.type.property-name'], c.yellow)
  ]
}
