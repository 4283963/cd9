import * as THREE from 'three'
import { ColorMapper } from '../core/ColorMapper'

export type TunnelShape = 'circular' | 'horseshoe'

export interface TunnelSegmentInfo {
  startZ: number
  endZ: number
  stressData: number[]
  startVertexIndex: number
  vertexCount: number
}

export interface TunnelOptions {
  radius?: number
  shape?: TunnelShape
  segmentsPerSection?: number
  radialSegments?: number
  segmentLength?: number
  initialCapacity?: number
  material?: THREE.Material
  colorMapper?: ColorMapper
}

export class Tunnel {
  public group: THREE.Group
  public mesh: THREE.Mesh
  public segments: TunnelSegmentInfo[] = []

  private radius: number
  private shape: TunnelShape
  private segmentsPerSection: number
  private radialSegments: number
  private segmentLength: number
  private material: THREE.Material
  private colorMapper: ColorMapper

  private totalLength: number = 0
  private capacitySegments: number
  private verticesPerSegment: number = 0
  private indicesPerSegment: number = 0
  private geometry: THREE.BufferGeometry

  private colorAttr: THREE.Float32BufferAttribute | null = null
  private positionAttr: THREE.BufferAttribute | null = null

  constructor(options: TunnelOptions = {}) {
    this.radius = options.radius ?? 5
    this.shape = options.shape ?? 'circular'
    this.segmentsPerSection = options.segmentsPerSection ?? 10
    this.radialSegments = options.radialSegments ?? 32
    this.segmentLength = options.segmentLength ?? 10
    this.capacitySegments = options.initialCapacity ?? 500
    this.colorMapper = options.colorMapper ?? new ColorMapper(0, 100)

    if (options.material) {
      this.material = options.material
    } else {
      this.material = new THREE.MeshStandardMaterial({
        color: 0x555566,
        roughness: 0.85,
        metalness: 0.15,
        side: THREE.DoubleSide,
        vertexColors: true
      })
    }

    this.group = new THREE.Group()
    this.group.name = 'tunnel'

    const singleSegGeo = this.createSingleSegmentGeometry()
    this.verticesPerSegment = singleSegGeo.attributes.position.count
    if (singleSegGeo.index) {
      this.indicesPerSegment = singleSegGeo.index.count
    }
    singleSegGeo.dispose()

    this.geometry = this.createMergedGeometry()
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.receiveShadow = true
    this.mesh.castShadow = false
    this.mesh.frustumCulled = false

    this.positionAttr = this.geometry.attributes.position as THREE.BufferAttribute
    this.colorAttr = this.geometry.attributes.color as THREE.Float32BufferAttribute

    this.group.add(this.mesh)
  }

  private createSingleSegmentGeometry(): THREE.BufferGeometry {
    if (this.shape === 'circular') {
      const geo = new THREE.CylinderGeometry(
        this.radius,
        this.radius,
        this.segmentLength,
        this.radialSegments,
        this.segmentsPerSection,
        true
      )
      geo.rotateX(Math.PI / 2)
      return geo
    } else {
      return this.createHorseshoeGeometry()
    }
  }

  private createHorseshoeGeometry(): THREE.BufferGeometry {
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
      depth: this.segmentLength,
      bevelEnabled: false
    }

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geo.rotateX(-Math.PI / 2)
    return geo
  }

  private createMergedGeometry(): THREE.BufferGeometry {
    const singleGeo = this.createSingleSegmentGeometry()
    const srcPos = singleGeo.attributes.position as THREE.BufferAttribute
    const srcNorm = singleGeo.attributes.normal as THREE.BufferAttribute
    const vertexCount = srcPos.count

    const totalVertices = vertexCount * this.capacitySegments

    const positions = new Float32Array(totalVertices * 3)
    const normals = new Float32Array(totalVertices * 3)
    const colors = new Float32Array(totalVertices * 3)

    for (let i = 0; i < this.capacitySegments; i++) {
      const zOffset = i * this.segmentLength

      for (let v = 0; v < vertexCount; v++) {
        const si = v * 3
        const di = (i * vertexCount + v) * 3

        positions[di] = srcPos.getX(v)
        positions[di + 1] = srcPos.getY(v)
        positions[di + 2] = srcPos.getZ(v) + zOffset

        normals[di] = srcNorm.getX(v)
        normals[di + 1] = srcNorm.getY(v)
        normals[di + 2] = srcNorm.getZ(v)

        colors[di] = 0.33
        colors[di + 1] = 0.33
        colors[di + 2] = 0.4
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    if (singleGeo.index) {
      const srcIndex = singleGeo.index
      const indexCount = srcIndex.count * this.capacitySegments
      const indices = new Uint32Array(indexCount)

      for (let i = 0; i < this.capacitySegments; i++) {
        const baseIdx = i * vertexCount
        for (let f = 0; f < srcIndex.count; f++) {
          indices[i * srcIndex.count + f] = baseIdx + srcIndex.getX(f)
        }
      }
      geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    }

    geometry.setDrawRange(0, 0)
    singleGeo.dispose()

    return geometry
  }

  private expandCapacity(newCapacity: number): void {
    if (newCapacity <= this.capacitySegments) return

    const oldCapacity = this.capacitySegments
    this.capacitySegments = newCapacity

    const oldPositions = this.positionAttr?.array as Float32Array
    const oldColors = this.colorAttr?.array as Float32Array
    const oldNormals = this.geometry.attributes.normal.array as Float32Array
    const oldIndices = this.geometry.index?.array as Uint32Array

    const totalVertices = this.verticesPerSegment * this.capacitySegments
    const newPositions = new Float32Array(totalVertices * 3)
    const newNormals = new Float32Array(totalVertices * 3)
    const newColors = new Float32Array(totalVertices * 3)

    newPositions.set(oldPositions)
    newNormals.set(oldNormals)
    newColors.set(oldColors)

    const singleGeo = this.createSingleSegmentGeometry()
    const srcPos = singleGeo.attributes.position as THREE.BufferAttribute
    const srcNorm = singleGeo.attributes.normal as THREE.BufferAttribute
    const vertexCount = this.verticesPerSegment

    for (let i = oldCapacity; i < this.capacitySegments; i++) {
      const zOffset = i * this.segmentLength

      for (let v = 0; v < vertexCount; v++) {
        const si = v * 3
        const di = (i * vertexCount + v) * 3

        newPositions[di] = srcPos.getX(v)
        newPositions[di + 1] = srcPos.getY(v)
        newPositions[di + 2] = srcPos.getZ(v) + zOffset

        newNormals[di] = srcNorm.getX(v)
        newNormals[di + 1] = srcNorm.getY(v)
        newNormals[di + 2] = srcNorm.getZ(v)

        newColors[di] = 0.33
        newColors[di + 1] = 0.33
        newColors[di + 2] = 0.4
      }
    }

    let newIndices: Uint32Array | null = null
    if (oldIndices && singleGeo.index) {
      const srcIndex = singleGeo.index
      const indexCount = srcIndex.count * this.capacitySegments
      newIndices = new Uint32Array(indexCount)
      newIndices.set(oldIndices)

      for (let i = oldCapacity; i < this.capacitySegments; i++) {
        const baseIdx = i * vertexCount
        for (let f = 0; f < srcIndex.count; f++) {
          newIndices[i * srcIndex.count + f] = baseIdx + srcIndex.getX(f)
        }
      }
    }

    this.geometry.dispose()
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3))
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(newNormals, 3))
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(newColors, 3))
    if (newIndices) {
      this.geometry.setIndex(new THREE.BufferAttribute(newIndices, 1))
    }

    this.mesh.geometry = this.geometry
    this.positionAttr = this.geometry.attributes.position as THREE.BufferAttribute
    this.colorAttr = this.geometry.attributes.color as THREE.Float32BufferAttribute

    if (this.geometry.index) {
      const totalIndexCount = this.segments.length * this.indicesPerSegment
      this.geometry.setDrawRange(0, totalIndexCount)
    } else {
      const totalVertCount = this.segments.length * this.verticesPerSegment
      this.geometry.setDrawRange(0, totalVertCount)
    }

    singleGeo.dispose()
    console.log(`[Tunnel] Capacity expanded: ${oldCapacity} → ${this.capacitySegments} segments`)
  }

  private updateSegmentColors(segmentIndex: number, stressData: number[]): void {
    if (!this.colorAttr || !this.positionAttr) return
    if (segmentIndex >= this.segments.length) return

    const segment = this.segments[segmentIndex]
    const startVert = segment.startVertexIndex
    const vertCount = segment.vertexCount
    const colors = this.colorAttr.array as Float32Array
    const positions = this.positionAttr.array as Float32Array

    for (let i = 0; i < vertCount; i++) {
      const vi = startVert + i
      const pi = vi * 3

      const x = positions[pi]
      const y = positions[pi + 1]

      const angle = Math.atan2(y, x)
      const normalizedAngle = (angle + Math.PI) / (2 * Math.PI)
      const stressIdx = Math.floor(normalizedAngle * stressData.length) % stressData.length
      const stress = stressData[stressIdx]

      const color = this.colorMapper.getColor(stress)

      colors[pi] = color.r
      colors[pi + 1] = color.g
      colors[pi + 2] = color.b
    }

    this.colorAttr.updateRange.offset = startVert * 3
    this.colorAttr.updateRange.count = vertCount * 3
    this.colorAttr.needsUpdate = true
  }

  public addSegment(_length?: number, stressData?: number[]): TunnelSegmentInfo {
    const startZ = this.totalLength
    const endZ = startZ + this.segmentLength

    if (this.segments.length >= this.capacitySegments) {
      this.expandCapacity(Math.ceil(this.capacitySegments * 1.5 + 100))
    }

    const stresses = stressData ?? this.generateStressData()
    const segmentIndex = this.segments.length
    const startVertexIndex = segmentIndex * this.verticesPerSegment

    const segment: TunnelSegmentInfo = {
      startZ,
      endZ,
      stressData: stresses,
      startVertexIndex,
      vertexCount: this.verticesPerSegment
    }

    this.segments.push(segment)
    this.totalLength += this.segmentLength

    this.updateSegmentColors(segmentIndex, stresses)

    if (this.geometry.index) {
      const totalIndexCount = this.segments.length * this.indicesPerSegment
      this.geometry.setDrawRange(0, totalIndexCount)
    } else {
      const totalVertCount = this.segments.length * this.verticesPerSegment
      this.geometry.setDrawRange(0, totalVertCount)
    }

    return segment
  }

  private generateStressData(): number[] {
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
    const lastIdx = this.segments.length - 1
    this.segments[lastIdx].stressData = stressData
    this.updateSegmentColors(lastIdx, stressData)
  }

  public updateAllStressData(stressDataArray: number[][]): void {
    const count = Math.min(stressDataArray.length, this.segments.length)
    for (let i = 0; i < count; i++) {
      this.updateSegmentColors(i, stressDataArray[i])
    }
  }

  public getTotalLength(): number {
    return this.totalLength
  }

  public getSegmentCount(): number {
    return this.segments.length
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
    this.segments = []
    this.totalLength = 0
    this.geometry.setDrawRange(0, 0)
    if (this.colorAttr) {
      this.colorAttr.needsUpdate = true
    }
  }

  public dispose(): void {
    this.geometry.dispose()
    if (this.material) {
      this.material.dispose()
    }
  }

  public getMesh(): THREE.Mesh {
    return this.mesh
  }

  public getCapacity(): number {
    return this.capacitySegments
  }

  public getVertexCount(): number {
    return this.segments.length * this.verticesPerSegment
  }

  public getTriangleCount(): number {
    if (this.indicesPerSegment > 0) {
      return Math.floor((this.segments.length * this.indicesPerSegment) / 3)
    }
    return Math.floor(this.segments.length * this.verticesPerSegment / 3)
  }

  public getSegmentLength(): number {
    return this.segmentLength
  }
}
