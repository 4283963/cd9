import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class SceneManager {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public controls: OrbitControls
  public ambientLight: THREE.AmbientLight
  public directionalLight: THREE.DirectionalLight
  public pointLights: THREE.PointLight[] = []

  private container: HTMLElement
  private animationId: number | null = null
  private animationCallbacks: Array<(delta: number) => void> = []
  private clock: THREE.Clock

  constructor(canvasId: string = 'scene-canvas') {
    this.clock = new THREE.Clock()
    
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`)
    }
    this.container = canvas.parentElement || document.body

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a1a)
    this.scene.fog = new THREE.Fog(0x0a0a1a, 100, 500)

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(30, 20, 30)

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 5
    this.controls.maxDistance = 200
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1

    this.ambientLight = new THREE.AmbientLight(0x404050, 0.5)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    this.directionalLight.position.set(50, 100, 50)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048
    this.directionalLight.shadow.camera.near = 0.5
    this.directionalLight.shadow.camera.far = 500
    this.directionalLight.shadow.camera.left = -100
    this.directionalLight.shadow.camera.right = 100
    this.directionalLight.shadow.camera.top = 100
    this.directionalLight.shadow.camera.bottom = -100
    this.scene.add(this.directionalLight)

    this.addPointLight(0, 10, 0, 0x00ffff, 0.5, 50)
    this.addPointLight(-20, 5, 20, 0xff6600, 0.3, 40)

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  public addPointLight(
    x: number,
    y: number,
    z: number,
    color: number,
    intensity: number,
    distance: number
  ): THREE.PointLight {
    const light = new THREE.PointLight(color, intensity, distance)
    light.position.set(x, y, z)
    light.castShadow = true
    this.scene.add(light)
    this.pointLights.push(light)
    return light
  }

  public addAnimationCallback(callback: (delta: number) => void): void {
    this.animationCallbacks.push(callback)
  }

  public removeAnimationCallback(callback: (delta: number) => void): void {
    const index = this.animationCallbacks.indexOf(callback)
    if (index > -1) {
      this.animationCallbacks.splice(index, 1)
    }
  }

  public startAnimation(): void {
    if (this.animationId !== null) return
    
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)
      
      const delta = this.clock.getDelta()
      
      this.controls.update()
      
      for (const callback of this.animationCallbacks) {
        callback(delta)
      }

      this.renderer.render(this.scene, this.camera)
    }
    
    animate()
  }

  public stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  public setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z)
  }

  public setCameraTarget(x: number, y: number, z: number): void {
    this.controls.target.set(x, y, z)
  }

  public dispose(): void {
    this.stopAnimation()
    window.removeEventListener('resize', this.onResize.bind(this))
    this.controls.dispose()
    this.renderer.dispose()
  }
}
