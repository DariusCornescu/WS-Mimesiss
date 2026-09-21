export function isPublicPath(path: string) {
  return path === '/' || ['/despre', '/contact', '/proiecte', '/congres'].some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}
