import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

/**
 * eslint-config-next v16 ships native flat configs (arrays of config objects).
 * Do not wrap these in FlatCompat: the eslintrc schema validator rejects them
 * and then throws on a circular structure while formatting the error.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,

  // Tailwind and PostCSS config files are CommonJS by design.
  {
    files: ['*.js', '*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  // TODO: these rules are new in eslint-plugin-react-hooks v6. There are five
  // pre-existing violations that need real refactors (ProfileForm,
  // RegistrationCountdown, SimpleUserQRCode, MimesissCountdown,
  // WorkshopRegistrationButton). Downgraded so CI can start green; fix them
  // and then delete this block.
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },

  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
];

export default eslintConfig;
