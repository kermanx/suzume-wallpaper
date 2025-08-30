export interface StickToDraw {
  index: number
  x: number
  y: number
  size: number
  angle: number
}

export function generate(width: number, height: number, total: number, density: number, sizeVariation: number = 1.0): StickToDraw[] {
  const sticks: StickToDraw[] = []

  const columnsPerSize = 100
  const columns = Array.from({ length: density * columnsPerSize }, () => 0)

  const scale = width / density
  const heightInUnit = height / scale

  console.log({ scale, heightInUnit })

  finish: while (true) {
    const indices = Array.from({ length: total }, (_, i) => i).sort(() => Math.random() - 0.5)

    for (const i of indices) {
      const size = rngRandom(0.9, 1.1) ** 2 * randomSelect({
        0.5: 2,
        1: 10,
        3: 2,
      }) ** sizeVariation

      for (let attempt = 0; ; attempt++) {
        const x = Math.floor(Math.random() * (density + 4)) - 2
        const deltaCol = columnsPerSize / 2.3 * size;
        const minCol = Math.floor(Math.max(0, x * columnsPerSize - deltaCol))
        const maxCol = Math.floor(Math.min(columns.length, x * columnsPerSize + deltaCol))

        let minY = Infinity;
        let maxY = -Infinity;
        for (let j = minCol; j < maxCol; j++) {
          const newY = columns[j] - rngRandom(0.0, 0.1)
          if (newY < minY) {
            minY = newY
          }
          if (newY > maxY) {
            maxY = newY
          }
        }
        for (let j = minCol; j < maxCol; j++) {
          columns[j] = minY + (maxY - minY) / 5 + size / 2
        }

        if (minY < heightInUnit + 2) {
          sticks.push({
            index: i,
            x: x * scale,
            y: minY * scale,
            size: size * scale,
            angle: rngRandom(-30, 30),
          })
          break
        }

        if (attempt > 5 * density * columnsPerSize) {
          break finish
        }
      }
    }
  }

  return sticks
}


function rngRandom(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomSelect<T extends string | number>(options: Record<T, number>): T {
  const total = Object.values<number>(options).reduce((a, b) => a + b, 0)
  const random = Math.random() * total
  let cumulative = 0

  for (const [key, value] of Object.entries(options)) {
    cumulative += value as number
    if (random < cumulative) {
      return key as T
    }
  }

  throw new Error('Unreachable')
}