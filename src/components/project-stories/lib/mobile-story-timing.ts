export type MobileStoryMoment = { chapter: number; enter: number; fadeStart: number; exit: number }

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const between = (value: number, start: number, end: number) => clamp((value - start) / Math.max(.0001, end - start))

export function mobileStoryMoments(chapters: number[]): MobileStoryMoment[] {
  const span = .82 / chapters.length
  return chapters.map((chapter, index) => {
    const enter = .12 + index * span
    return { chapter, enter, fadeStart: enter + span * .5, exit: enter + span * .62 }
  })
}

export function mobileStoryFrame(scroll: number, moments: MobileStoryMoment[], stops: number[]) {
  const opacities = moments.map(moment => between(scroll, moment.enter, moment.enter + .02) * (1 - between(scroll, moment.fadeStart, moment.exit)))
  let progress = stops[moments[0].chapter] * between(scroll, 0, moments[0].enter)
  for (let index = 0; index < moments.length; index++) {
    const moment = moments[index]
    if (scroll < moment.enter) break
    progress = stops[moment.chapter]
    const next = moments[index + 1]
    if (next && scroll > moment.exit) {
      progress += (stops[next.chapter] - stops[moment.chapter]) * between(scroll, moment.exit, next.enter)
    }
  }
  return { progress, opacities }
}
