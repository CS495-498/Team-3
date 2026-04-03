const srcDir = new URL('./src/', import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const mapped = new URL(specifier.slice(2), srcDir).href;
    try {
      return await nextResolve(mapped, context);
    } catch (err) {
      // Try with .js extension if bare import fails (Node ESM requires extensions)
      if (err.code === 'ERR_MODULE_NOT_FOUND' && !mapped.endsWith('.js')) {
        return nextResolve(mapped + '.js', context);
      }
      throw err;
    }
  }

  if (specifier.startsWith('next/') && !specifier.endsWith('.js')) {
    try {
      return await nextResolve(specifier, context);
    } catch (err) {
      if (err.code === 'ERR_MODULE_NOT_FOUND') {
        return nextResolve(`${specifier}.js`, context);
      }
      throw err;
    }
  }

  return nextResolve(specifier, context);
}
