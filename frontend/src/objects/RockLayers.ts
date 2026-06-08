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
  layers?: RockLayerConfig[]
}

export class RockLayers {
  public group: THREE.Group
  public layers: Map<string, THREE.Mesh> = new Map()
  public visible: boolean = true

  private width: number
  private length: number
  private layerConfigs: RockLayerConfig[]

  constructor(options: RockLayersOptions = {}) {
    this.width = options.width ?? 100
    this.length = options.length ?? 500
    this.layerConfigs = options.layers ?? this.getDefaultLayers()

    this.group = new THREE.Group()
    this.group.name = 'rock-layers'

    this.createLayers()
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
      const geometry = new THREE.BoxGeometry(this.width, thickness, this.length)
      
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
      mesh.position.z = this.length / 2
      mesh.receiveShadow = true
      mesh.name = config.name

      this.layers.set(config.name, mesh)
      this.group.add(mesh)
    }

    this.createGridLines()
  }

  private createGridLines(): void {
    const gridGroup = new THREE.Group()
    gridGroup.name = 'grid-lines'

    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x333344,
      transparent: true,
      opacity: 0.3
    })

    for (let z = 0; z <= this.length; z += 20) {
      const points: THREE.Vector3[] = []
      points.push(new THREE.Vector3(-this.width / 2, -100, z))
      points.push(new THREE.Vector3(this.width / 2, -100, z))
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(geometry, gridMaterial)
      gridGroup.add(line)
    }

    for (let x = -this.width / 2; x <= this.width / 2; x += 20) {
      const points: THREE.Vector3[] = []
      points.push(new THREE.Vector3(x, -100, 0))
      points.push(new THREE.Vector3(x, -100, this.length))
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(geometry, gridMaterial)
      gridGroup.add(line)
    }

    this.group.add(gridGroup)
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
    this.length = length
    
    for (const [name, mesh] of this.layers) {
      const config = this.layerConfigs.find(l => l.name === name)
      if (!config) continue

      const thickness = config.top - config.bottom
      const geometry = new THREE.BoxGeometry(this.width, thickness, this.length)
      mesh.geometry.dispose()
      mesh.geometry = geometry
      mesh.position.z = this.length / 2
    }

    const gridLines = this.group.getObjectByName('grid-lines')
    if (gridLines) {
      this.group.remove(gridLines)
      gridLines.traverse((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose()
        }
      })
      this.createGridLines()
    }
  }

  public getLayerAtDepth(depth: number): RockLayerConfig | undefined {
    return this.layerConfigs.find(layer => depth <= layer.top && depth >= layer.bottom)
  }

  public getLayers(): RockLayerConfig[] {
    return [...this.layerConfigs]
  }

  public dispose(): void {
    for (const mesh of this.layers.values()) {
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    }
    this.layers.clear()
  }
}
