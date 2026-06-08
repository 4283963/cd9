import * as THREE from 'three'

export interface ColorRange {
  min: number
  max: number
}

export interface ColorStop {
  value: number
  color: THREE.Color
}

export class ColorMapper {
  private colorStops: ColorStop[]
  private minValue: number
  private maxValue: number

  constructor(minValue: number = 0, maxValue: number = 100) {
    this.minValue = minValue
    this.maxValue = maxValue
    this.colorStops = [
      { value: 0.0, color: new THREE.Color(0x0066ff) },
      { value: 0.33, color: new THREE.Color(0x00ff88) },
      { value: 0.66, color: new THREE.Color(0xffcc00) },
      { value: 1.0, color: new THREE.Color(0xff3300) }
    ]
  }

  public setRange(min: number, max: number): void {
    this.minValue = min
    this.maxValue = max
  }

  public getMinValue(): number {
    return this.minValue
  }

  public getMaxValue(): number {
    return this.maxValue
  }

  public setColorStops(stops: ColorStop[]): void {
    this.colorStops = stops.sort((a, b) => a.value - b.value)
  }

  public getColorStops(): ColorStop[] {
    return [...this.colorStops]
  }

  public getColor(value: number): THREE.Color {
    const t = this.normalize(value)

    if (t <= 0) return this.colorStops[0].color.clone()
    if (t >= 1) return this.colorStops[this.colorStops.length - 1].color.clone()

    for (let i = 0; i < this.colorStops.length - 1; i++) {
      const stop1 = this.colorStops[i]
      const stop2 = this.colorStops[i + 1]

      if (t >= stop1.value && t <= stop2.value) {
        const localT = (t - stop1.value) / (stop2.value - stop1.value)
        return stop1.color.clone().lerp(stop2.color, localT)
      }
    }

    return this.colorStops[0].color.clone()
  }

  public getHexColor(value: number): number {
    return this.getColor(value).getHex()
  }

  public getRGBString(value: number): string {
    const color = this.getColor(value)
    return `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`
  }

  private normalize(value: number): number {
    if (this.maxValue === this.minValue) return 0.5
    return (value - this.minValue) / (this.maxValue - this.minValue)
  }

  public createGradientCanvas(width: number = 200, height: number = 20): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    
    for (const stop of this.colorStops) {
      const color = stop.color
      gradient.addColorStop(stop.value, `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`)
    }

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    return canvas
  }

  public createTexture(width: number = 256, height: number = 1): THREE.Texture {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    for (let i = 0; i < width; i++) {
      const t = i / (width - 1)
      const value = this.minValue + t * (this.maxValue - this.minValue)
      const color = this.getColor(value)
      ctx.fillStyle = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`
      ctx.fillRect(i, 0, 1, 1)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }
}
