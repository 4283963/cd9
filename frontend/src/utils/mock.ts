import { RealTimeData, TBMStatus, StressData, GroundWaterData, RockLayer } from '../types'

export function generateMockData(): RealTimeData {
  const tbmStatus: TBMStatus = {
    mileage: 0,
    speed: 0.8,
    cutterSpeed: 3,
    thrust: 15000,
    torque: 5000,
    position: {
      x: 0,
      y: -20,
      z: 0,
      pitch: 0,
      yaw: 0,
      roll: 0
    }
  }

  const stressDistribution: number[] = []
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2
    stressDistribution.push(40 + Math.sin(angle * 2) * 20 + Math.random() * 10)
  }

  const stressData: StressData = {
    segmentId: 0,
    position: 0,
    maxStress: 60,
    minStress: 20,
    avgStress: 40,
    stressDistribution
  }

  const pressureDistribution: number[][] = []
  for (let i = 0; i < 101; i++) {
    const row: number[] = []
    for (let j = 0; j < 51; j++) {
      row.push(0.1 + (i / 100) * 0.5 + Math.random() * 0.1)
    }
    pressureDistribution.push(row)
  }

  const groundWater: GroundWaterData = {
    waterLevel: -15,
    waterPressure: 0.15,
    pressureDistribution
  }

  const rockLayers: RockLayer[] = [
    { name: '表土层', depth: 5, thickness: 5, hardness: 10, color: '#8B4513' },
    { name: '砂岩', depth: 0, thickness: 15, hardness: 40, color: '#D2691E' },
    { name: '石灰岩', depth: -15, thickness: 20, hardness: 60, color: '#BEBEBE' },
    { name: '花岗岩', depth: -35, thickness: 25, hardness: 80, color: '#696969' },
    { name: '基岩', depth: -60, thickness: 40, hardness: 100, color: '#2F4F4F' }
  ]

  return {
    timestamp: Date.now(),
    tbmStatus,
    stressData,
    groundWater,
    rockLayers
  }
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals)
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour12: false })
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN')
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
