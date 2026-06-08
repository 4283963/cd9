import * as THREE from 'three'
import { ColorMapper } from '../core/ColorMapper'

export interface GroundWaterOptions {
  width?: number
  length?: number
  maxLength?: number
  waterLevel?: number
  color?: number
  opacity?: number
  pressureMin?: number
  pressureMax?: number
  waveAmplitude?: number
  waveSpeed?: number
}

const waterVertexShader = `
  uniform float uTime;
  uniform float uWaveAmplitude;
  uniform float uWaveSpeed;
  uniform float uWaterLevel;
  
  varying vec2 vUv;
  varying float vElevation;
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    float wave1 = sin((pos.z + uTime * uWaveSpeed * 10.0) * 0.1) * uWaveAmplitude;
    float wave2 = sin((pos.x + uTime * uWaveSpeed * 5.0) * 0.15) * 0.5 * uWaveAmplitude;
    float wave3 = sin((pos.x + pos.z + uTime * uWaveSpeed * 8.0) * 0.08) * 0.3 * uWaveAmplitude;
    
    float elevation = wave1 + wave2 + wave3;
    vElevation = elevation;
    
    pos.y = uWaterLevel + elevation;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const waterFragmentShader = `
  uniform float uOpacity;
  uniform vec3 uWaterColor;
  uniform float uPressureMin;
  uniform float uPressureMax;
  uniform sampler2D uPressureTexture;
  uniform bool uUsePressureTexture;
  uniform float uWaveAmplitude;
  
  varying vec2 vUv;
  varying float vElevation;
  
  vec3 getPressureColor(float pressure) {
    float t = clamp((pressure - uPressureMin) / (uPressureMax - uPressureMin), 0.0, 1.0);
    
    vec3 colorLow = vec3(0.0, 0.4, 1.0);
    vec3 colorMid = vec3(0.0, 1.0, 0.5);
    vec3 colorHigh = vec3(1.0, 0.8, 0.0);
    vec3 colorMax = vec3(1.0, 0.2, 0.1);
    
    if (t < 0.33) {
      return mix(colorLow, colorMid, t / 0.33);
    } else if (t < 0.66) {
      return mix(colorMid, colorHigh, (t - 0.33) / 0.33);
    } else {
      return mix(colorHigh, colorMax, (t - 0.66) / 0.34);
    }
  }
  
  void main() {
    vec3 baseColor = uWaterColor;
    
    if (uUsePressureTexture) {
      float pressure = texture2D(uPressureTexture, vUv).r;
      vec3 pressureColor = getPressureColor(pressure);
      baseColor = mix(baseColor, pressureColor, 0.6);
    }
    
    float normalizedElev = uWaveAmplitude > 0.0 ? vElevation / uWaveAmplitude : 0.0;
    float highlight = smoothstep(0.0, 1.0, normalizedElev * 0.5 + 0.5) * 0.2;
    vec3 finalColor = baseColor + highlight;
    
    float alpha = uOpacity + vElevation * 0.5;
    
    gl_FragColor = vec4(finalColor, clamp(alpha, 0.1, 0.7));
  }
`

export class GroundWater {
  public group: THREE.Group
  public waterMesh: THREE.Mesh
  public visible: boolean = true

  private width: number
  private maxLength: number
  private currentLength: number
  private waterLevel: number
  private opacity: number
  private colorMapper: ColorMapper
  private pressureData: number[][] = []
  private time: number = 0
  private waveAmplitude: number
  private waveSpeed: number

  private waterMaterial: THREE.ShaderMaterial
  private pressureTexture: THREE.DataTexture | null = null

  private cols: number = 20
  private rows: number = 40

  constructor(options: GroundWaterOptions = {}) {
    this.width = options.width ?? 100
    this.currentLength = options.length ?? 500
    this.maxLength = options.maxLength ?? 10000
    this.waterLevel = options.waterLevel ?? -15
    this.opacity = options.opacity ?? 0.4
    this.waveAmplitude = options.waveAmplitude ?? 0.1
    this.waveSpeed = options.waveSpeed ?? 0.5

    const pressureMin = options.pressureMin ?? 0.1
    const pressureMax = options.pressureMax ?? 1.0
    this.colorMapper = new ColorMapper(pressureMin, pressureMax)

    this.group = new THREE.Group()
    this.group.name = 'ground-water'

    this.waterMaterial = this.createShaderMaterial()

    this.waterMesh = this.createWaterMesh()
    this.group.add(this.waterMesh)

    this.initializePressureData()
  }

  private createShaderMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWaveAmplitude: { value: this.waveAmplitude },
        uWaveSpeed: { value: this.waveSpeed },
        uWaterLevel: { value: this.waterLevel },
        uOpacity: { value: this.opacity },
        uWaterColor: { value: new THREE.Color(0x00aaff) },
        uPressureMin: { value: 0.1 },
        uPressureMax: { value: 1.0 },
        uPressureTexture: { value: null },
        uUsePressureTexture: { value: false }
      },
      transparent: true,
      side: THREE.DoubleSide
    })
  }

  private createWaterMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.width, this.maxLength, this.cols, this.rows)
    geometry.rotateX(-Math.PI / 2)

    const mesh = new THREE.Mesh(geometry, this.waterMaterial)
    mesh.position.z = this.maxLength / 2
    mesh.receiveShadow = true
    mesh.frustumCulled = true

    return mesh
  }

  private initializePressureData(): void {
    const rows = this.rows + 1
    const cols = this.cols + 1

    this.pressureData = []

    for (let i = 0; i < rows; i++) {
      this.pressureData[i] = []
      for (let j = 0; j < cols; j++) {
        const depthFactor = (i / rows) * 0.5
        const basePressure = 0.1 + depthFactor * 0.6
        this.pressureData[i][j] = basePressure + Math.random() * 0.1
      }
    }

    this.updatePressureTexture()
  }

  private updatePressureTexture(): void {
    const rows = this.rows + 1
    const cols = this.cols + 1

    const data = new Uint8Array(rows * cols)

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const pressure = this.pressureData[i]?.[j] ?? 0.3
        const normalized = Math.min(1, Math.max(0, pressure))
        data[i * cols + j] = Math.floor(normalized * 255)
      }
    }

    if (this.pressureTexture) {
      this.pressureTexture.dispose()
    }

    this.pressureTexture = new THREE.DataTexture(
      data,
      cols,
      rows,
      THREE.RedFormat,
      THREE.UnsignedByteType
    )
    this.pressureTexture.needsUpdate = true

    this.waterMaterial.uniforms.uPressureTexture.value = this.pressureTexture
    this.waterMaterial.uniforms.uUsePressureTexture.value = true
  }

  public update(deltaTime: number): void {
    this.time += deltaTime

    if (!this.visible) return

    this.waterMaterial.uniforms.uTime.value = this.time
  }

  public setWaterLevel(level: number): void {
    this.waterLevel = level
    this.waterMaterial.uniforms.uWaterLevel.value = level
  }

  public getWaterLevel(): number {
    return this.waterLevel
  }

  public setOpacity(opacity: number): void {
    this.opacity = opacity
    this.waterMaterial.uniforms.uOpacity.value = opacity
  }

  public setPressureData(data: number[][]): void {
    this.pressureData = data
    this.updatePressureTexture()
  }

  public getPressureAtPosition(x: number, z: number): number {
    const cols = this.cols + 1
    const rows = this.rows + 1

    const col = Math.floor(((x / this.width) + 0.5) * (cols - 1))
    const row = Math.floor((z / this.maxLength) * (rows - 1))

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

  public updateLength(_length: number): void {
  }

  public getColorMapper(): ColorMapper {
    return this.colorMapper
  }

  public setWaveAmplitude(amplitude: number): void {
    this.waveAmplitude = amplitude
    this.waterMaterial.uniforms.uWaveAmplitude.value = amplitude
  }

  public setWaveSpeed(speed: number): void {
    this.waveSpeed = speed
    this.waterMaterial.uniforms.uWaveSpeed.value = speed
  }

  public dispose(): void {
    this.waterMesh.geometry.dispose()
    this.waterMaterial.dispose()

    if (this.pressureTexture) {
      this.pressureTexture.dispose()
    }
  }

  public getLength(): number {
    return this.currentLength
  }

  public getMaxLength(): number {
    return this.maxLength
  }
}
