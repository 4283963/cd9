import * as THREE from 'three'
import { ColorMapper } from '../core/ColorMapper'

export type TunnelShape = 'circular' | 'horseshoe'

export interface TunnelSegment {
  startZ: number
  endZ: number
  stressData: number[]
  mesh: THREE.Mesh
}

export interface TunnelOptions {
  radius?: number
  shape?: TunnelShape
  segmentsPerSection?: number
  radialSegments?: number
  material?: THREE.Material
  colorMapper?: ColorMapper
}

export class Tunnel {
  public group: THREE.Group
  public segments: TunnelSegment[] = []
  
  private radius: number
  private shape: TunnelShape
  private segmentsPerSection: number
  private radialSegments: number
  private material: THREE.Material
  private colorMapper: ColorMapper
  private totalLength: number = 0

  constructor(options: TunnelOptions = {}) {
    this.radius = options.radius ?? 5
    this.shape = options.shape ?? 'circular'
    this.segmentsPerSection = options.segmentsPerSection ?? 20
    this.radialSegments = options.radialSegments ?? 32
    this.colorMapper = options.colorMapper ?? new ColorMapper(0, 100)
    
    if (options.material) {
      this.material = options.material
    } else {
      this.material = new THREE.MeshStandardMaterial({
        color: 0x555566,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide,
        vertexColors: true
      })
    }

    this.group = new THREE.Group()
    this.group.name = 'tunnel'
  }

  public addSegment(length: number, stressData?: number[]): TunnelSegment {
    const startZ = this.totalLength
    const endZ = startZ + length

    const geometry = this.createTunnelGeometry(length, startZ)
    
    const stresses = stressData ?? this.generateStressData(length)
    this.applyStressColors(geometry, stresses, startZ, length)

    const mesh = new THREE.Mesh(geometry, this.material)
    mesh.position.z = startZ
    mesh.receiveShadow = true
    mesh.castShadow = true

    const segment: TunnelSegment = {
      startZ,
      endZ,
      stressData: stresses,
      mesh
    }

    this.segments.push(segment)
    this.group.add(mesh)
    this.totalLength += length

    return segment
  }

  private createTunnelGeometry(length: number, offsetZ: number = 0): THREE.BufferGeometry {
    if (this.shape === 'circular') {
      return this.createCircularGeometry(length)
    } else {
      return this.createHorseshoeGeometry(length)
    }
  }

  private createCircularGeometry(length: number): THREE.BufferGeometry {
    const geometry = new THREE.CylinderGeometry(
      this.radius,
      this.radius,
      length,
      this.radialSegments,
      this.segmentsPerSection,
      true
    )
    geometry.rotateX(Math.PI / 2)
    geometry.translate(0, 0, length / 2)
    return geometry
  }

  private createHorseshoeGeometry(length: number): THREE.BufferGeometry {
    const points: THREE.Vector2[] = []
    
    for (let i = 0; i <= this.radialSegments / 2; i++) {
      const angle = Math.PI + (i / (this.radialSegments / 2)) * Math.PI
      const x = Math.cos(angle) * this.radius
      const y = Math.sin(angle) * this.radius
      points.push(new THREE.Vector2(x, y))
    }
    
    points.push(new THREE.Vector2(-this.radius, -this.radius * 0.8))
    points.push(new THREE.Vector2(this.radius, -this.radius * 0.8))

    const shape = new THREE.Shape(points)
    const extrudeSettings = {
      steps: this.segmentsPerSection,
      depth: length,
      bevelEnabled: false
    }

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.rotateX(-Math.PI / 2)
    return geometry
  }

  private applyStressColors(
    geometry: THREE.BufferGeometry,
    stressData: number[],
    startZ: number,
    length: number
  ): void {
    const colors: number[] = []
    const positions = geometry.attributes.position
    const vertexCount = positions.count

    for (let i = 0; i < vertexCount; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)

      const angle = Math.atan2(y, x)
      const normalizedAngle = (angle + Math.PI) / (2 * Math.PI)
      const stressIndex = Math.floor(normalizedAngle * stressData.length) % stressData.length
      const stress = stressData[stressIndex]

      const color = this.colorMapper.getColor(stress)
      colors.push(color.r, color.g, color.b)
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  }

  private generateStressData(length: number): number[] {
    const data: number[] = []
    const baseStress = 30 + Math.random() * 20
    
    for (let i = 0; i < this.radialSegments; i++) {
      const angle = (i / this.radialSegments) * Math.PI * 2
      const variation = Math.sin(angle * 2) * 15 + Math.sin(angle * 3 + 1) * 10
      data.push(Math.max(0, Math.min(100, baseStress + variation + Math.random() * 10)))
    }
    
    return data
  }

  public updateStressData(stressData: number[]): void {
    if (this.segments.length === 0) return

    const lastSegment = this.segments[this.segments.length - 1]
    const geometry = lastSegment.mesh.geometry
    this.applyStressColors(geometry, stressData, lastSegment.startZ, lastSegment.endZ - lastSegment.startZ)
    geometry.attributes.color.needsUpdate = true
    lastSegment.stressData = stressData
  }

  public getTotalLength(): number {
    return this.totalLength
  }

  public setRadius(radius: number): void {
    this.radius = radius
  }

  public getRadius(): number {
    return this.radius
  }

  public setColorMapper(colorMapper: ColorMapper): void {
    this.colorMapper = colorMapper
  }

  public getColorMapper(): ColorMapper {
    return this.colorMapper
  }

  public clear(): void {
    for (const segment of this.segments) {
      this.group.remove(segment.mesh)
      segment.mesh.geometry.dispose()
    }
    this.segments = []
    this.totalLength = 0
  }

  public dispose(): void {
    this.clear()
    if (this.material) {
      this.material.dispose()
    }
  }
}
