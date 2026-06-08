import * as THREE from 'three'

export interface MarkerPoint {
  id: string
  position: THREE.Vector3
  timestamp: number
  note?: string
  stressLevel?: number
}

export interface FirstPersonOptions {
  moveSpeed?: number
  sprintSpeed?: number
  mouseSensitivity?: number
  height?: number
  tunnelRadius?: number
}

export class FirstPersonController {
  public camera: THREE.PerspectiveCamera
  public group: THREE.Group
  public markers: MarkerPoint[] = []
  public markerGroup: THREE.Group
  public active: boolean = false

  private moveSpeed: number
  private sprintSpeed: number
  private mouseSensitivity: number
  private height: number
  private tunnelRadius: number

  private yaw: number = 0
  private pitch: number = 0

  private keys: Record<string, boolean> = {}
  private velocity: THREE.Vector3 = new THREE.Vector3()

  private onMarkerCallback?: (marker: MarkerPoint) => void

  private pointerLocked: boolean = false
  private tempVector: THREE.Vector3 = new THREE.Vector3()
  private tempDirection: THREE.Vector3 = new THREE.Vector3()

  private tunnelLength: number = 0
  private minZ: number = 0
  private maxZ: number = 1000

  private bobTime: number = 0
  private bobAmplitude: number = 0.05
  private baseHeight: number

  constructor(camera: THREE.PerspectiveCamera, options: FirstPersonOptions = {}) {
    this.camera = camera
    this.moveSpeed = options.moveSpeed ?? 8
    this.sprintSpeed = options.sprintSpeed ?? 20
    this.mouseSensitivity = options.mouseSensitivity ?? 0.002
    this.height = options.height ?? 1.7
    this.tunnelRadius = options.tunnelRadius ?? 5
    this.baseHeight = this.height

    this.group = new THREE.Group()
    this.group.name = 'first-person'

    this.markerGroup = new THREE.Group()
    this.markerGroup.name = 'markers'
    this.group.add(this.markerGroup)
  }

  public setTunnelBounds(minZ: number, maxZ: number, radius: number): void {
    this.minZ = minZ
    this.maxZ = maxZ
    this.tunnelRadius = radius
  }

  public setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z)
  }

  public setRotation(yaw: number, pitch: number): void {
    this.yaw = yaw
    this.pitch = pitch
    this.updateCameraRotation()
  }

  public activate(): void {
    this.active = true
    this.setupEventListeners()

    setTimeout(() => {
      const canvas = document.getElementById('scene-canvas')
      if (canvas && !this.pointerLocked) {
        canvas.requestPointerLock().catch(() => {
          console.log('[FirstPerson] User must click to enable pointer lock')
        })
      }
    }, 100)
  }

  public deactivate(): void {
    this.active = false
    this.removeEventListeners()
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('pointerlockchange', this.handlePointerLockChange)

    const canvas = document.getElementById('scene-canvas')
    if (canvas) {
      canvas.addEventListener('click', this.handleCanvasClick)
    }
  }

  private removeEventListeners(): void {
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange)

    const canvas = document.getElementById('scene-canvas')
    if (canvas) {
      canvas.removeEventListener('click', this.handleCanvasClick)
    }

    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
  }

  private handleCanvasClick = (): void => {
    if (this.active && !this.pointerLocked) {
      const canvas = document.getElementById('scene-canvas')
      if (canvas) {
        canvas.requestPointerLock()
      }
    }
  }

  private handlePointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement !== null
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.active) return

    this.keys[e.code] = true

    if (e.code === 'Space') {
      e.preventDefault()
      this.addMarker()
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (!this.active) return
    this.keys[e.code] = false
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.active || !this.pointerLocked) return

    this.yaw -= e.movementX * this.mouseSensitivity
    this.pitch -= e.movementY * this.mouseSensitivity

    this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch))

    this.updateCameraRotation()
  }

  private updateCameraRotation(): void {
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.yaw
    this.camera.rotation.x = this.pitch
  }

  public update(deltaTime: number): void {
    if (!this.active) return

    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight']
    const speed = isSprinting ? this.sprintSpeed : this.moveSpeed

    const forward = new THREE.Vector3()
    this.camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    const moveDir = new THREE.Vector3()

    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      moveDir.add(forward)
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      moveDir.sub(forward)
    }
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      moveDir.sub(right)
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      moveDir.add(right)
    }

    if (moveDir.length() > 0) {
      moveDir.normalize()
      moveDir.multiplyScalar(speed * deltaTime)

      const newPos = this.camera.position.clone().add(moveDir)

      newPos.z = Math.max(this.minZ + 1, Math.min(this.maxZ - 1, newPos.z))

      const horizontalDist = Math.sqrt(newPos.x * newPos.x + (newPos.y - this.baseHeight) * (newPos.y - this.baseHeight))
      const maxDist = this.tunnelRadius * 0.8

      if (horizontalDist > maxDist) {
        const angle = Math.atan2(newPos.y - this.baseHeight, newPos.x)
        newPos.x = Math.cos(angle) * maxDist
        newPos.y = this.baseHeight + Math.sin(angle) * maxDist * 0.5
      }

      this.camera.position.copy(newPos)

      this.bobTime += deltaTime * (isSprinting ? 10 : 6)
      const bobOffset = Math.sin(this.bobTime) * this.bobAmplitude * (isSprinting ? 1.5 : 1)
      this.camera.position.y += bobOffset
    }
  }

  public addMarker(note?: string): MarkerPoint | null {
    const position = this.camera.position.clone()

    const marker: MarkerPoint = {
      id: 'marker-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      position,
      timestamp: Date.now(),
      note
    }

    this.markers.push(marker)

    const markerMesh = this.createMarkerMesh(marker)
    this.markerGroup.add(markerMesh)

    if (this.onMarkerCallback) {
      this.onMarkerCallback(marker)
    }

    console.log(`[Marker] Added marker at ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`)
    return marker
  }

  private createMarkerMesh(marker: MarkerPoint): THREE.Group {
    const group = new THREE.Group()
    group.name = marker.id

    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 8)
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
    })
    const pole = new THREE.Mesh(poleGeo, poleMat)
    pole.position.y = 1
    pole.castShadow = true
    group.add(pole)

    const flagGeo = new THREE.PlaneGeometry(0.8, 0.5)
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      side: THREE.DoubleSide,
      emissive: 0xff0000,
      emissiveIntensity: 0.2
    })
    const flag = new THREE.Mesh(flagGeo, flagMat)
    flag.position.set(0.4, 2 - 0.25, 0)
    group.add(flag)

    const ringGeo = new THREE.RingGeometry(0.3, 0.5, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.02
    group.add(ring)

    group.position.copy(marker.position)
    group.position.y = marker.position.y - this.baseHeight

    return group
  }

  public removeMarker(id: string): boolean {
    const index = this.markers.findIndex(m => m.id === id)
    if (index === -1) return false

    this.markers.splice(index, 1)

    const mesh = this.markerGroup.getObjectByName(id)
    if (mesh) {
      this.markerGroup.remove(mesh)
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
    }

    return true
  }

  public clearMarkers(): void {
    this.markers = []

    while (this.markerGroup.children.length > 0) {
      const child = this.markerGroup.children[0]
      this.markerGroup.remove(child)
      child.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose()
          if (node.material instanceof THREE.Material) {
            node.material.dispose()
          }
        }
      })
    }
  }

  public setOnMarkerCallback(callback: (marker: MarkerPoint) => void): void {
    this.onMarkerCallback = callback
  }

  public getMarkers(): MarkerPoint[] {
    return [...this.markers]
  }

  public isPointerLocked(): boolean {
    return this.pointerLocked
  }

  public getPosition(): THREE.Vector3 {
    return this.camera.position.clone()
  }

  public getYaw(): number {
    return this.yaw
  }

  public getPitch(): number {
    return this.pitch
  }

  public dispose(): void {
    this.deactivate()
    this.clearMarkers()
  }
}
