import * as THREE from 'three'

export interface MineCartOptions {
  width?: number
  length?: number
  height?: number
  bodyColor?: number
  wheelColor?: number
  seatHeight?: number
}

export class MineCart {
  public group: THREE.Group
  public body: THREE.Group
  public wheels: THREE.Group
  public seatPosition: THREE.Vector3 = new THREE.Vector3()

  private width: number
  private length: number
  private height: number
  private seatHeight: number
  private wheelRadius: number = 0.4

  private wheelRotation: number = 0
  private moveSpeed: number = 0

  constructor(options: MineCartOptions = {}) {
    this.width = options.width ?? 2.2
    this.length = options.length ?? 3.5
    this.height = options.height ?? 1.8
    this.seatHeight = options.seatHeight ?? 1.2

    this.group = new THREE.Group()
    this.group.name = 'mine-cart'

    this.body = new THREE.Group()
    this.body.name = 'cart-body'
    this.group.add(this.body)

    this.wheels = new THREE.Group()
    this.wheels.name = 'cart-wheels'
    this.group.add(this.wheels)

    this.createBody()
    this.createWheels()
    this.createDetails()

    this.seatPosition.set(0, this.seatHeight, 0)
  }

  private createBody(): void {
    const bodyColor = 0x4a4a5a
    const metalMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.6,
      metalness: 0.4
    })

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x333344,
      roughness: 0.5,
      metalness: 0.6
    })

    const floorGeo = new THREE.BoxGeometry(this.width, 0.15, this.length)
    const floor = new THREE.Mesh(floorGeo, metalMat)
    floor.position.y = 0.5
    floor.castShadow = true
    floor.receiveShadow = true
    this.body.add(floor)

    const sideHeight = 0.8
    const sideThickness = 0.1

    const leftSideGeo = new THREE.BoxGeometry(sideThickness, sideHeight, this.length)
    const leftSide = new THREE.Mesh(leftSideGeo, metalMat)
    leftSide.position.set(-this.width / 2 + sideThickness / 2, 0.5 + sideHeight / 2, 0)
    leftSide.castShadow = true
    this.body.add(leftSide)

    const rightSideGeo = new THREE.BoxGeometry(sideThickness, sideHeight, this.length)
    const rightSide = new THREE.Mesh(rightSideGeo, metalMat)
    rightSide.position.set(this.width / 2 - sideThickness / 2, 0.5 + sideHeight / 2, 0)
    rightSide.castShadow = true
    this.body.add(rightSide)

    const frontGeo = new THREE.BoxGeometry(this.width, sideHeight, sideThickness)
    const front = new THREE.Mesh(frontGeo, metalMat)
    front.position.set(0, 0.5 + sideHeight / 2, -this.length / 2 + sideThickness / 2)
    front.castShadow = true
    this.body.add(front)

    const backGeo = new THREE.BoxGeometry(this.width, sideHeight, sideThickness)
    const back = new THREE.Mesh(backGeo, metalMat)
    back.position.set(0, 0.5 + sideHeight / 2, this.length / 2 - sideThickness / 2)
    back.castShadow = true
    this.body.add(back)

    const frameBarGeo = new THREE.BoxGeometry(this.width + 0.2, 0.08, 0.08)
    const frontBar = new THREE.Mesh(frameBarGeo, frameMat)
    frontBar.position.set(0, 0.5 + sideHeight - 0.1, -this.length / 2 - 0.05)
    frontBar.castShadow = true
    this.body.add(frontBar)

    const backBar = new THREE.Mesh(frameBarGeo, frameMat)
    backBar.position.set(0, 0.5 + sideHeight - 0.1, this.length / 2 + 0.05)
    backBar.castShadow = true
    this.body.add(backBar)

    const roofHeight = this.seatHeight + 0.6
    const roofGeo = new THREE.BoxGeometry(this.width + 0.2, 0.08, this.length + 0.3)
    const roof = new THREE.Mesh(roofGeo, frameMat)
    roof.position.set(0, roofHeight, 0)
    roof.castShadow = true
    this.body.add(roof)

    const pillarGeo = new THREE.BoxGeometry(0.08, roofHeight - sideHeight - 0.5, 0.08)
    const pillarPositions = [
      [-this.width / 2 + 0.2, 0.5 + sideHeight - 0.1, -this.length / 2 + 0.3],
      [this.width / 2 - 0.2, 0.5 + sideHeight - 0.1, -this.length / 2 + 0.3],
      [-this.width / 2 + 0.2, 0.5 + sideHeight - 0.1, this.length / 2 - 0.3],
      [this.width / 2 - 0.2, 0.5 + sideHeight - 0.1, this.length / 2 - 0.3]
    ]

    for (const pos of pillarPositions) {
      const pillar = new THREE.Mesh(pillarGeo, frameMat)
      pillar.position.set(pos[0], pos[1] + (roofHeight - sideHeight - 0.5) / 2, pos[2])
      pillar.castShadow = true
      this.body.add(pillar)
    }
  }

  private createWheels(): void {
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.2
    })

    const wheelPositions = [
      [-this.width / 2 + 0.3, this.wheelRadius, -this.length / 3],
      [this.width / 2 - 0.3, this.wheelRadius, -this.length / 3],
      [-this.width / 2 + 0.3, this.wheelRadius, this.length / 3],
      [this.width / 2 - 0.3, this.wheelRadius, this.length / 3]
    ]

    for (const pos of wheelPositions) {
      const wheelGeo = new THREE.CylinderGeometry(this.wheelRadius, this.wheelRadius, 0.2, 16)
      wheelGeo.rotateZ(Math.PI / 2)
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.position.set(pos[0], pos[1], pos[2])
      wheel.castShadow = true
      this.wheels.add(wheel)

      const hubGeo = new THREE.CylinderGeometry(this.wheelRadius * 0.3, this.wheelRadius * 0.3, 0.22, 8)
      hubGeo.rotateZ(Math.PI / 2)
      const hubMat = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.3,
        metalness: 0.8
      })
      const hub = new THREE.Mesh(hubGeo, hubMat)
      hub.position.set(pos[0], pos[1], pos[2])
      this.wheels.add(hub)
    }
  }

  private createDetails(): void {
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffaa,
      emissive: 0xffff88,
      emissiveIntensity: 0.8
    })

    const headlightGeo = new THREE.SphereGeometry(0.15, 8, 8)
    const headlight1 = new THREE.Mesh(headlightGeo, headlightMat)
    headlight1.position.set(-0.5, 1, -this.length / 2 + 0.1)
    this.body.add(headlight1)

    const headlight2 = new THREE.Mesh(headlightGeo, headlightMat)
    headlight2.position.set(0.5, 1, -this.length / 2 + 0.1)
    this.body.add(headlight2)

    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x332211,
      roughness: 0.9
    })

    const seatGeo = new THREE.BoxGeometry(1.2, 0.1, 1.0)
    const seat = new THREE.Mesh(seatGeo, seatMat)
    seat.position.set(0, this.seatHeight - 0.6, 0.3)
    seat.castShadow = true
    this.body.add(seat)

    const backrestGeo = new THREE.BoxGeometry(1.2, 0.6, 0.1)
    const backrest = new THREE.Mesh(backrestGeo, seatMat)
    backrest.position.set(0, this.seatHeight - 0.3, 0.8)
    backrest.castShadow = true
    this.body.add(backrest)
  }

  public update(deltaTime: number, speed: number): void {
    this.moveSpeed = speed

    const angularSpeed = speed / this.wheelRadius
    this.wheelRotation += angularSpeed * deltaTime

    for (const wheel of this.wheels.children) {
      if (wheel instanceof THREE.Mesh) {
        wheel.rotation.x = this.wheelRotation
      }
    }
  }

  public setPosition(x: number, y: number, z: number): void {
    this.group.position.set(x, y, z)
  }

  public setRotation(y: number): void {
    this.group.rotation.y = y
  }

  public getPosition(): THREE.Vector3 {
    return this.group.position.clone()
  }

  public getSeatWorldPosition(): THREE.Vector3 {
    const worldPos = this.seatPosition.clone()
    worldPos.applyMatrix4(this.group.matrixWorld)
    return worldPos
  }

  public getHeadlightPositions(): THREE.Vector3[] {
    const positions: THREE.Vector3[] = []
    for (const child of this.body.children) {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (child.material.emissive && child.material.emissive.r > 0.5) {
          positions.push(child.getWorldPosition(new THREE.Vector3()))
        }
      }
    }
    return positions
  }

  public dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })
  }
}
