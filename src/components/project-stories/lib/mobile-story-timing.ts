export type MobileChapterBounds = { top: number; bottom: number }

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const between = (value: number, start: number, end: number) => clamp((value - start) / Math.max(1, end - start))

export function mobileStoryFrame(scroll: number, height: number, bounds: MobileChapterBounds[], stops: number[]) {
  const timings = bounds.map(chapter => {
    const arrival = chapter.top - height * .4
    // Keep long chapters readable until their final lines reach the lower reading area.
    const fadeStart = Math.max(arrival + height * .12, chapter.bottom - height * .78)
    return { arrival, fadeStart, fadeEnd: fadeStart + height * .16 }
  })
  const opacities = timings.map(chapter => between(scroll, chapter.arrival - height * .22, chapter.arrival) * (1 - between(scroll, chapter.fadeStart, chapter.fadeEnd)))
  let progress = stops[0] * between(scroll, 0, timings[0].arrival)
  for (let index = 0; index < timings.length; index++) {
    if (scroll < timings[index].arrival) break
    progress = stops[index]
    const next = timings[index + 1]
    if (next && scroll > timings[index].fadeEnd) {
      progress += (stops[index + 1] - stops[index]) * between(scroll, timings[index].fadeEnd, next.arrival)
    }
  }
  return { progress, opacities }
}
