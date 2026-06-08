import * as THREE from 'three'
import { ColorMapper } from '../core/ColorMapper'

export interface GroundWaterOptions {
  width?: number
  length?: number
  waterLevel?: number
  color?: number
  opacity?: number
  pressureMin?: number
  pressureMax?: number
}

export class GroundWater {
  public group: THREE.Group
  public waterMesh: THREE.Mesh
  public visible: boolean = true

  private width: number
  private length: number
  private waterLevel: number
  private opacity: number
  private colorMapper: ColorMapper
  private pressureData: number[][] = []
  private time: number = 0
  private waveAmplitude: number = 0.1
  private waveSpeed: number = 0.5

  constructor(options: GroundWaterOptions = {}) {
    this.width = options.width ?? 100
    this.length = options.length ?? 500
    this.waterLevel = options.waterLevel ?? -15
    this.opacity = options.opacity ?? 0.4

    const pressureMin = options.pressureMin ?? 0.1
    const pressureMax = options.pressureMax ?? 1.0
    this.colorMapper = new ColorMapper(pressureMin, pressureMax)

    this.group = new THREE.Group()
    this.group.name = 'ground-water'

    this.waterMesh = this.createWaterMesh()
    this.group.add(this.waterMesh)

    this.initializePressureData()
  }

  private createWaterMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.width, this.length, 50, 100)
    geometry.rotateX(-Math.PI / 2)

    const material = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: this.opacity,
      side: THREE.DoubleSide,
      vertexColors: true,
      roughness: 0.1,
      metalness: 0.3
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = this.waterLevel
    mesh.position.z = this.length / 2
    mesh.receiveShadow = true

    return mesh
  }

  private initializePressureData(): void {
    const rows = 101
    const cols = 51
    
    for (let i = 0; i < rows; i++) {
      this.pressureData[i] = []
      for (let j = 0; j < cols; j++) {
        const depthFactor = (i / rows) * 0.5
        const basePressure = 0.1 + depthFactor * 0.6
        this.pressureData[i][j] = basePressure + Math.random() * 0.1
      }
    }

    this.updateVertexColors()
  }

  private updateVertexColors(): void {
    const geometry = this.waterMesh.geometry
    const positions = geometry.attributes.position
    const vertexCount = positions.count
    const colors: number[] = []

    const cols = 51
    const rows = 101

    for (let i = 0; i < vertexCount; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols

      if (row < rows && col < cols && this.pressureData[row]) {
        const pressure = this.pressureData[row][col] ?? 0.3
        const color = this.colorMapper.getColor(pressure)
        colors.push(color.r, color.g, color.b)
      } else {
        colors.push(0, 0.5, 1)
      }
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  }

  public update(deltaTime: number): void {
    this.time += deltaTime

    if (!this.visible) return

    const positions = this.waterMesh.geometry.attributes.position
    const cols = 51
    const rows = 101

    for (let i = 0; i < positions.count; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      
      const z = (row / (rows - 1)) * this.length
      const x = ((col / (cols - 1)) - 0.5) * this.width
      
      const wave1 = Math.sin((z + this.time * this.waveSpeed * 10) * 0.1) * this.waveAmplitude
      const wave2 = Math.sin((x + this.time * this.waveSpeed * 5) * 0.15) * this.waveAmplitude * 0.5
      
      positions.setY(i, this.waterLevel + wave1 + wave2)
    }

    positions.needsUpdate = true
    this.waterMesh.geometry.computeVertexNormals()
  }

  public setWaterLevel(level: number): void {
    this.waterLevel = level
  }

  public getWaterLevel(): number {
    return this.waterLevel
  }

  public setOpacity(opacity: number): void {
    this.opacity = opacity
    if (this.waterMesh.material instanceof THREE.MeshStandardMaterial) {
      this.waterMesh.material.opacity = opacity
    }
  }

  public setPressureData(data: number[][]): void {
    this.pressureData = data
    this.updateVertexColors()
  }

  public getPressureAtPosition(x: number, z: number): number {
    const cols = 51
    const rows = 101
    
    const col = Math.floor(((x / this.width) + 0.5) * (cols - 1))
    const row = Math.floor((z / this.length) * (rows - 1))
    
    const clampedCol = Math.max(0, Math.min(cols - 1, col))
    const clampedRow = Math.max(0, Math.min(rows - 1, row))
    
    return this.pressureData[clampedRow]?.[clampedCol] ?? 0.3
  }

  public toggle(): void {
    this.visible = !this.visible
    this.group.visible = this.visible
  }

  public setVisible(visible: boolean): void {
    this.visible = visible
    this.group.visible = visible
  }

  public updateLength(length: number): void {
    this.length = length
    
    const geometry = new THREE.PlaneGeometry(this.width, this.length, 50, 100)
    geometry.rotateX(-Math.PI / 2)
    this.waterMesh.geometry.dispose()
    this.waterMesh.geometry = geometry
    this.waterMesh.position.z = this.length / 2

    this.initializePressureData()
  }

  public getColorMapper(): ColorMapper {
    return this.colorMapper
  }

  public dispose(): void {
    this.waterMesh.geometry.dispose()
    if (this.waterMesh.material instanceof THREE.Material) {
      this.waterMesh.material.dispose()
    }
  }
}
