const EM_DESENVOLVIMENTO = import.meta.env.DEV

export function debugLog(namespace, message, payload) {
  if (!EM_DESENVOLVIMENTO || typeof console === 'undefined' || typeof console.debug !== 'function') {
    return
  }

  const prefixo = `[${namespace}] ${message}`

  if (payload === undefined) {
    console.debug(prefixo)
    return
  }

  console.debug(prefixo, payload)
}
