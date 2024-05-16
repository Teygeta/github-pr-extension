import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  rules: {
    curly: ['error', 'multi-line', 'consistent'],
    'node/prefer-global/process': 'off',
  },
})
