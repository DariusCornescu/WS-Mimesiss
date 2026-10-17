export function isPublicPath(path: string) {
  return path === '/' || ['/despre', '/contact', '/proiecte', '/congres'].some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

// Workshop pages read per-user registration state and must retain auth context.
export function canRenderWithoutAuth(path: string, method: string) {
  return (method === 'GET' || method === 'HEAD') && isPublicPath(path) &&
    path !== '/congres/workshops' && !path.startsWith('/congres/workshops/')
}
