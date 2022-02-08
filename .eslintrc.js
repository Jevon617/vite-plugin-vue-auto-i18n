module.exports = {
  parser: 'vue-eslint-parser', // 检测vue template中表达式和指令中的错误
  parserOptions: {
    sourceType: 'module', // 指定代码类型是ECMAScript 模块
    ecmaFeatures: {
      jsx: true, // 启用jsx
      tsx: true,
      impliedStrict: true // 启用全局 strict mode
    }
  },
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: [ // 继承别人项目的eslint风格
    'plugin:vue/vue3-recommended' // vue3 推荐风格(https://eslint.vuejs.org/user-guide/#usage)
  ],
  rules: {
    // style
    'block-spacing': 'error',
    'eol-last': 'error',
    'no-trailing-spaces': 'error', // 禁止行尾空格
    'comma-style': ['error', 'last'],
    'comma-dangle': ['error', 'never'],
    'no-multi-spaces': 'error',
    semi: ['error', 'never'],
    'arrow-parens':['error', 'as-needed'],
    'array-bracket-spacing': ['error', 'never'],
    'indent': ['error', 2],
    'object-curly-spacing': 'off',
    quotes: 'off',
    'space-infix-ops': 'off',
    camelcase: ['error', { properties: 'never' }],
    // vue
    'vue/no-v-html': 'off', // 禁止使用v-html
    'vue/singleline-html-element-content-newline': 'off',
    'vue/html-self-closing': ['error', {
      html: {
        void: 'never',
        normal: 'never',
        component: 'always'
      }
    }],
    'vue/max-attributes-per-line': ['error', {
      singleline: 3,
      multiline: 1
    }],
    'vue/require-default-prop': 'off',
    'vue/html-closing-bracket-spacing': 'error',
    'vue/html-indent': ['error', 4, {
      'attribute': 1,
      'baseIndent': 1,
      'closeBracket': 0,
      'alignAttributesVertically': true,
      'ignores': []
    }]
  }
}
