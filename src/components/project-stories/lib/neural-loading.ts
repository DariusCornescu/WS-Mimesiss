export function neuralStagePriority(progress: number) {
  const current = progress > .79 ? 3 : progress > .55 ? 2 : progress > .31 ? 1 : 0
  return [...new Set([current, current - 1, current + 1, 0, 1, 2, 3])].filter(index => index >= 0 && index < 4)
}

export function shouldPrepareNeuralStage(index: number, progress: number) {
  return index < 2 || progress > (index === 2 ? .15 : .45)
}

export function requiredNeuralStages(progress: number) {
  if (progress < .05) return [0, 1]
  const current = neuralStagePriority(progress)[0]
  const arrival = [.19, .43, .67, .9][current]
  return current > 0 && progress < arrival ? [current - 1, current] : [current]
}

export function afterScenePaint(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Scene loading cancelled', 'AbortError')); return }
    let frame = 0
    const abort = () => { cancelAnimationFrame(frame); reject(new DOMException('Scene loading cancelled', 'AbortError')) }
    signal.addEventListener('abort', abort, { once: true })
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => { signal.removeEventListener('abort', abort); resolve() })
    })
  })
}
