import * as THREE from 'three'

export interface RockLayerConfig {
  name: string
  top: number
  bottom: number
  color: number
  opacity?: number
  hardness?: number
}

export interface RockLayersOptions {
  width?: number
  length?: number
  maxLength?: number
  layers?: RockLayerConfig[]
}

export class RockLayers {
  public group: THREE.Group
  public layers: Map<string, THREE.Mesh> = new Map()
  public visible: boolean = true

  private width: number
  private maxLength: number
  private currentLength: number
  private layerConfigs: RockLayerConfig[]
  private gridGroup: THREE.Group | null = null
  private gridMaterial: THREE.LineBasicMaterial | null = null

  constructor(options: RockLayersOptions = {}) {
    this.width = options.width ?? 100
    this.currentLength = options.length ?? 500
    this.maxLength = options.maxLength ?? 10000
    this.layerConfigs = options.layers ?? this.getDefaultLayers()

    this.group = new THREE.Group()
    this.group.name = 'rock-layers'

    this.gridMaterial = new THREE.LineBasicMaterial({
      color: 0x333344,
      transparent: true,
      opacity: 0.3
    })

    this.createLayers()
    this.createGridLines()
  }

  private getDefaultLayers(): RockLayerConfig[] {
    return [
      { name: 'topsoil', top: 5, bottom: 0, color: 0x8B4513, opacity: 0.6, hardness: 10 },
      { name: 'sandstone', top: 0, bottom: -15, color: 0xD2691E, opacity: 0.5, hardness: 40 },
      { name: 'limestone', top: -15, bottom: -35, color: 0xBEBEBE, opacity: 0.5, hardness: 60 },
      { name: 'granite', top: -35, bottom: -60, color: 0x696969, opacity: 0.5, hardness: 80 },
      { name: 'basement', top: -60, bottom: -100, color: 0x2F4F4F, opacity: 0.6, hardness: 100 }
    ]
  }

  private createLayers(): void {
    for (const config of this.layerConfigs) {
      const thickness = config.top - config.bottom
      const geometry = new THREE.BoxGeometry(this.width, thickness, this.maxLength)

      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity ?? 0.5,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.y = config.top - thickness / 2
      mesh.position.z = this.maxLength / 2
      mesh.receiveShadow = true
      mesh.castShadow = false
      mesh.frustumCulled = true
      mesh.name = config.name

      this.layers.set(config.name, mesh)
      this.group.add(mesh)
    }
  }

  private createGridLines(): void {
    if (!this.gridMaterial) return

    this.gridGroup = new THREE.Group()
    this.gridGroup.name = 'grid-lines'

    const gridSpacing = 50
    const gridCount = Math.ceil(this.maxLength / gridSpacing)

    for (let i = 0; i <= gridCount; i++) {
      const z = i * gridSpacing
      if (z > this.maxLength) break

      const points: THREE.Vector3[] = [
        new THREE.Vector3(-this.width / 2, -100, z),
        new THREE.Vector3(this.width / 2, -100, z)
      ]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(geometry, this.gridMaterial)
      line.visible = z <= this.currentLength
      line.name = `grid-z-${i}`
      line.frustumCulled = true
      this.gridGroup.add(line)
    }

    const xCount = Math.ceil(this.width / 20)
    for (let i = 0; i <= xCount; i++) {
      const x = -this.width / 2 + i * 20

      const points: THREE.Vector3[] = [
        new THREE.Vector3(x, -100, 0),
        new THREE.Vector3(x, -100, this.currentLength)
      ]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(geometry, this.gridMaterial)
      line.name = `grid-x-${i}`
      line.frustumCulled = true
      this.gridGroup.add(line)
    }

    this.group.add(this.gridGroup)
  }

  public setLayerOpacity(layerName: string, opacity: number): void {
    const layer = this.layers.get(layerName)
    if (layer && layer.material instanceof THREE.MeshStandardMaterial) {
      layer.material.opacity = opacity
    }
  }

  public setLayerColor(layerName: string, color: number): void {
    const layer = this.layers.get(layerName)
    if (layer && layer.material instanceof THREE.MeshStandardMaterial) {
      layer.material.color.setHex(color)
    }
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
    if (length <= this.currentLength) return
    if (length > this.maxLength) {
      length = this.maxLength
    }

    this.currentLength = length
    this.updateGridLines(length)
  }

  private updateGridLines(length: number): void {
    if (!this.gridGroup) return

    const gridSpacing = 50
    const gridCount = Math.ceil(this.maxLength / gridSpacing)

    for (let i = 0; i <= gridCount; i++) {
      const z = i * gridSpacing
      const line = this.gridGroup.children.find(
        c => c.name === `grid-z-${i}`
      ) as THREE.Line
      if (line) {
        line.visible = z <= length
      }
    }

    const xLines = this.gridGroup.children.filter(c => c.name?.startsWith('grid-x-'))
    for (const line of xLines) {
      if (line instanceof THREE.Line) {
        const positions = line.geometry.attributes.position as THREE.BufferAttribute
        const posArr = positions.array as Float32Array
        posArr[5] = length
        positions.needsUpdate = true
        line.geometry.computeBoundingSphere()
      }
    }
  }

  public getLayerAtDepth(depth: number): RockLayerConfig | undefined {
    return this.layerConfigs.find(layer => depth <= layer.top && depth >= layer.bottom)
  }

  public getLayers(): RockLayerConfig[] {
    return [...this.layerConfigs]
  }

  public getLength(): number {
    return this.currentLength
  }

  public getMaxLength(): number {
    return this.maxLength
  }

  public dispose(): void {
    for (const mesh of this.layers.values()) {
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    }
    this.layers.clear()

    if (this.gridMaterial) {
      this.gridMaterial.dispose()
    }

    if (this.gridGroup) {
      this.gridGroup.traverse((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose()
        }
      })
    }
  }
}
