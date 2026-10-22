// Test-only: lets `node --test` load this codebase's lib/ files, which use
// Next.js-style extensionless imports ("./touchClassify"). Adds ".js" to a
// relative import that has no extension. Not used by the site.
import { register } from 'node:module';

register('data:text/javascript,' + encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    if (/^\\.{1,2}\\//.test(specifier) && !/\\.[a-z]+$/i.test(specifier)) {
      try { return await next(specifier + '.js', context); } catch {}
    }
    return next(specifier, context);
  }
`));
