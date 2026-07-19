import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Existing API and UI files still contain a small amount of legacy
      // typing debt. Keep these visible in CI without blocking production
      // builds while they are replaced with concrete types incrementally.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Empty catch blocks are currently used only for optional browser
      // capabilities such as vibration/audio feedback.
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
])
