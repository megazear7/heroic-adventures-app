import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import watchGlobs from 'rollup-plugin-watch-globs';

export default {
  input: 'src/client/app.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
  },
  onwarn(warning) {
    if (warning.code !== 'THIS_IS_UNDEFINED') {
      console.error(`(!) ${warning.message}`);
    }
  },
  plugins: [
    replace({preventAssignment: false, 'Reflect.decorate': 'undefined'}),
    typescript({
      declaration: false,
      declarationMap: false,
      outDir: 'dist',
    }),
    resolve(),
    copy({
      targets: [{ src: 'src/static/**/*', dest: 'dist' }],
    }),
    watchGlobs(['src/static/**/*']),
  ],
};
