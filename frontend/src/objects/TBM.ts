import * as THREE from 'three'

export interface TBMOptions {
  radius?: number
  length?: number
  cutterHeadColor?: number
  bodyColor?: number
  tailColor?: number
}

export class TBM {
  public group: THREE.Group
  public cutterHead: THREE.Group
  public body: THREE.Group
  public tail: THREE.Group

  private radius: number
  private length: number
  private cutterHeadSpeed: number = 1
  private cutterHeadRotation: number = 0
  private targetPosition: THREE.Vector3 = new THREE.Vector3()
  private currentPosition: THREE.Vector3 = new THREE.Vector3()

  constructor(options: TBMOptions = {}) {
    this.radius = options.radius ?? 4.5
    this.length = options.length ?? 15
    const cutterHeadColor = options.cutterHeadColor ?? 0xff6600
    const bodyColor = options.bodyColor ?? 0x4488ff
    const tailColor = options.tailColor ?? 0x666688

    this.group = new THREE.Group()
    this.group.name = 'tbm'

    this.cutterHead = this.createCutterHead(cutterHeadColor)
    this.body = this.createBody(bodyColor)
    this.tail = this.createTail(tailColor)

    this.group.add(this.cutterHead)
    this.group.add(this.body)
    this.group.add(this.tail)
  }

  private createCutterHead(color: number): THREE.Group {
    const group = new THREE.Group()
    group.name = 'cutter-head'

    const headGeo = new THREE.CylinderGeometry(this.radius, this.radius * 0.9, 1.5, 32)
    headGeo.rotateX(Math.PI / 2)
    const headMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.8
    })
    const headMesh = new THREE.Mesh(headGeo, headMat)
    headMesh.castShadow = true
    group.add(headMesh)

    const cutterMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.3,
      metalness: 0.9
    })

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const cutterGeo = new THREE.BoxGeometry(0.3, this.radius * 0.8, 0.2)
      const cutterMesh = new THREE.Mesh(cutterGeo, cutterMat)
      cutterMesh.position.set(
        Math.cos(angle) * this.radius * 0.4,
        Math.sin(angle) * this.radius * 0.4,
        0.8
      )
      cutterMesh.rotation.z = angle
      cutterMesh.castShadow = true
      group.add(cutterMesh)
    }

    const centerGeo = new THREE.ConeGeometry(1, 1.5, 16)
    centerGeo.rotateX(-Math.PI / 2)
    const centerMesh = new THREE.Mesh(centerGeo, cutterMat)
    centerMesh.position.z = 1.2
    centerMesh.castShadow = true
    group.add(centerMesh)

    group.position.z = -this.length / 2 - 0.75

    return group
  }

  private createBody(color: number): THREE.Group {
    const group = new THREE.Group()
    group.name = 'body'

    const bodyLength = this.length * 0.5
    const bodyGeo = new THREE.CylinderGeometry(this.radius * 0.95, this.radius * 0.95, bodyLength, 32)
    bodyGeo.rotateX(Math.PI / 2)
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.6
    })
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
    bodyMesh.castShadow = true
    group.add(bodyMesh)

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const thrusterGeo = new THREE.CylinderGeometry(0.3, 0.3, bodyLength * 0.8, 16)
      thrusterGeo.rotateX(Math.PI / 2)
      const thrusterMat = new THREE.MeshStandardMaterial({
        color: 0x2266cc,
        roughness: 0.4,
        metalness: 0.7
      })
      const thrusterMesh = new THREE.Mesh(thrusterGeo, thrusterMat)
      thrusterMesh.position.set(
        Math.cos(angle) * this.radius * 0.7,
        Math.sin(angle) * this.radius * 0.7,
        0
      )
      thrusterMesh.castShadow = true
      group.add(thrusterMesh)
    }

    group.position.z = -this.length / 2 + 1.5 + bodyLength / 2

    return group
  }

  private createTail(color: number): THREE.Group {
    const group = new THREE.Group()
    group.name = 'tail'

    const tailLength = this.length * 0.35
    const tailGeo = new THREE.CylinderGeometry(this.radius * 0.9, this.radius * 0.85, tailLength, 32)
    tailGeo.rotateX(Math.PI / 2)
    const tailMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.5
    })
    const tailMesh = new THREE.Mesh(tailGeo, tailMat)
    tailMesh.castShadow = true
    group.add(tailMesh)

    const segments = 5
    for (let i = 0; i < segments; i++) {
      const ringGeo = new THREE.TorusGeometry(this.radius * 0.88 - i * 0.05, 0.1, 8, 32)
      ringGeo.rotateY(Math.PI / 2)
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x8888aa,
        roughness: 0.5,
        metalness: 0.6
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.position.z = -tailLength / 2 + (i / (segments - 1)) * tailLength
      ringMesh.castShadow = true
      group.add(ringMesh)
    }

    group.position.z = -this.length / 2 + 1.5 + this.length * 0.5 + tailLength / 2

    return group
  }

  public update(deltaTime: number): void {
    this.cutterHeadRotation += this.cutterHeadSpeed * deltaTime * 2
    this.cutterHead.rotation.z = this.cutterHeadRotation

    this.currentPosition.lerp(this.targetPosition, deltaTime * 2)
    this.group.position.copy(this.currentPosition)
  }

  public setPosition(x: number, y: number, z: number): void {
    this.targetPosition.set(x, y, z)
  }

  public setRotation(pitch: number, yaw: number, roll: number): void {
    this.group.rotation.set(pitch, yaw, roll)
  }

  public setCutterHeadSpeed(speed: number): void {
    this.cutterHeadSpeed = speed
  }

  public getCutterHeadSpeed(): number {
    return this.cutterHeadSpeed
  }

  public getPosition(): THREE.Vector3 {
    return this.currentPosition.clone()
  }

  public getLength(): number {
    return this.length
  }

  public getRadius(): number {
    return this.radius
  }

  public dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }
}
