import { getSensorService, getTBMService, getRockLayerService, getGroundWaterService } from './';
import { ISensorData, ITBMStatus, IRockLayer, IGroundWater } from '../models';

export interface TBMPositionDTO {
  x: number;
  y: number;
  z: number;
  pitch: number;
  yaw: number;
  roll: number;
}

export interface TBMStatusDTO {
  mileage: number;
  speed: number;
  cutterSpeed: number;
  thrust: number;
  torque: number;
  position: TBMPositionDTO;
}

export interface StressDataDTO {
  segmentId: number;
  position: number;
  maxStress: number;
  minStress: number;
  avgStress: number;
  stressDistribution: number[];
}

export interface RockLayerDTO {
  name: string;
  depth: number;
  thickness: number;
  hardness: number;
  color: string;
}

export interface GroundWaterDataDTO {
  waterLevel: number;
  waterPressure: number;
  pressureDistribution: number[][];
}

export interface RealTimeDataDTO {
  timestamp: number;
  tbmStatus: TBMStatusDTO;
  stressData: StressDataDTO;
  groundWater: GroundWaterDataDTO;
  rockLayers: RockLayerDTO[];
}

const ROCK_LAYER_COLORS: Record<string, string> = {
  '表土层': '#8B7355',
  '风化岩层': '#A0522D',
  '砂岩层': '#CD853F',
  '泥岩层': '#6B4423',
  '石灰岩层': '#B0C4DE',
  '砂岩层II': '#DAA520',
  '板岩层': '#2F4F4F',
  '粘土': '#8B7355',
  '风化砂岩': '#A0522D',
  '砂岩': '#CD853F',
  '泥岩': '#6B4423',
  '石灰岩': '#B0C4DE',
  '板岩': '#2F4F4F',
};

class RealtimeDataService {
  private stressDistributionPoints = 32;

  constructor() {}

  async getRealtimeData(): Promise<RealTimeDataDTO> {
    const [tbmStatus, sensorData, rockLayers, groundWater] = await Promise.all([
      this.getTBMStatusDTO(),
      this.getStressDataDTO(),
      this.getRockLayersDTO(),
      this.getGroundWaterDTO(),
    ]);

    return {
      timestamp: Date.now(),
      tbmStatus,
      stressData: sensorData,
      groundWater,
      rockLayers,
    };
  }

  private async getTBMStatusDTO(): Promise<TBMStatusDTO> {
    const tbmService = getTBMService();
    const status = await tbmService.getCurrentStatus();

    if (!status) {
      return this.createEmptyTBMStatus();
    }

    return this.convertTBMStatus(status);
  }

  private convertTBMStatus(status: ITBMStatus): TBMStatusDTO {
    return {
      mileage: status.totalDistance || 0,
      speed: (status.excavationSpeed || 0) * 60,
      cutterSpeed: status.cutterHeadSpeed || 0,
      thrust: status.thrustForce || 0,
      torque: status.torque || 0,
      position: {
        x: status.positionY || 0,
        y: status.positionZ || 0,
        z: status.totalDistance || 0,
        pitch: status.pitch || 0,
        yaw: status.yaw || 0,
        roll: status.roll || 0,
      },
    };
  }

  private createEmptyTBMStatus(): TBMStatusDTO {
    return {
      mileage: 0,
      speed: 0,
      cutterSpeed: 0,
      thrust: 0,
      torque: 0,
      position: {
        x: 0,
        y: 0,
        z: 0,
        pitch: 0,
        yaw: 0,
        roll: 0,
      },
    };
  }

  private async getStressDataDTO(): Promise<StressDataDTO> {
    const sensorService = getSensorService();
    const tbmService = getTBMService();

    const [tbmStatus, latestSensors] = await Promise.all([
      tbmService.getCurrentStatus(),
      sensorService.getLatestSensorData(50),
    ]);

    const mileage = tbmStatus?.totalDistance || 0;

    const stressValues = latestSensors
      .filter(s => s.sensorType === 'stress' || typeof s.stress === 'number')
      .map(s => s.stress || 0);

    const stressDistribution = this.calculateStressDistribution(latestSensors, mileage);

    const maxStress = stressValues.length > 0 ? Math.max(...stressValues) : 0;
    const minStress = stressValues.length > 0 ? Math.min(...stressValues) : 0;
    const avgStress = stressValues.length > 0
      ? stressValues.reduce((a, b) => a + b, 0) / stressValues.length
      : 0;

    return {
      segmentId: Math.floor(mileage / 10),
      position: mileage,
      maxStress,
      minStress,
      avgStress,
      stressDistribution,
    };
  }

  private calculateStressDistribution(sensors: ISensorData[], mileage: number): number[] {
    const distribution: number[] = new Array(this.stressDistributionPoints).fill(0);
    const counts: number[] = new Array(this.stressDistributionPoints).fill(0);

    const nearbySensors = sensors.filter(s =>
      Math.abs((s.x || 0) - mileage) < 30
    );

    if (nearbySensors.length === 0) {
      return new Array(this.stressDistributionPoints).fill(30);
    }

    let centerY = 0;
    let centerZ = 0;
    let stressSensors = nearbySensors.filter(s => typeof s.stress === 'number');
    if (stressSensors.length > 0) {
      centerY = stressSensors.reduce((sum, s) => sum + (s.y || 0), 0) / stressSensors.length;
      centerZ = stressSensors.reduce((sum, s) => sum + (s.z || 0), 0) / stressSensors.length;
    }

    for (const sensor of nearbySensors) {
      if (typeof sensor.stress !== 'number') continue;

      const relY = (sensor.y || 0) - centerY;
      const relZ = (sensor.z || 0) - centerZ;

      if (Math.abs(relY) < 0.01 && Math.abs(relZ) < 0.01) continue;

      const angle = Math.atan2(relZ, relY);
      const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
      const index = Math.floor(normalizedAngle * this.stressDistributionPoints) % this.stressDistributionPoints;

      distribution[index] += sensor.stress;
      counts[index]++;
    }

    for (let i = 0; i < this.stressDistributionPoints; i++) {
      if (counts[i] > 0) {
        distribution[i] /= counts[i];
      }
    }

    let lastValidIndex = -1;
    for (let i = 0; i < this.stressDistributionPoints * 2; i++) {
      const idx = i % this.stressDistributionPoints;
      if (counts[idx] > 0) {
        lastValidIndex = idx;
      } else if (lastValidIndex >= 0) {
        let nextValidIdx = -1;
        for (let j = 1; j < this.stressDistributionPoints; j++) {
          const searchIdx = (idx + j) % this.stressDistributionPoints;
          if (counts[searchIdx] > 0) {
            nextValidIdx = searchIdx;
            break;
          }
        }
        if (nextValidIdx >= 0) {
          const steps = (nextValidIdx - idx + this.stressDistributionPoints) % this.stressDistributionPoints + 1;
          const startVal = distribution[lastValidIndex];
          const endVal = distribution[nextValidIdx];
          let k = 1;
          let currIdx = idx;
          while (currIdx !== nextValidIdx) {
            const t = k / steps;
            distribution[currIdx] = startVal + (endVal - startVal) * t;
            counts[currIdx] = 1;
            k++;
            currIdx = (currIdx + 1) % this.stressDistributionPoints;
          }
        }
      }
    }

    const allZero = distribution.every(v => v === 0);
    if (allZero) {
      const avgStress = stressSensors.length > 0
        ? stressSensors.reduce((sum, s) => sum + (s.stress || 0), 0) / stressSensors.length
        : 30;
      return new Array(this.stressDistributionPoints).fill(avgStress);
    }

    return distribution;
  }

  private async getRockLayersDTO(): Promise<RockLayerDTO[]> {
    const rockLayerService = getRockLayerService();
    const layers = await rockLayerService.getAllRockLayers();

    return layers.map(layer => this.convertRockLayer(layer));
  }

  private convertRockLayer(layer: IRockLayer): RockLayerDTO {
    const thickness = (layer.endDepth || 0) - (layer.startDepth || 0);
    const color = ROCK_LAYER_COLORS[layer.rockType || '']
      || ROCK_LAYER_COLORS[layer.name || '']
      || '#808080';

    return {
      name: layer.name || '未知岩层',
      depth: layer.endDepth || 0,
      thickness: thickness,
      hardness: layer.hardness || 0,
      color,
    };
  }

  private async getGroundWaterDTO(): Promise<GroundWaterDataDTO> {
    const groundWaterService = getGroundWaterService();
    const dataList = await groundWaterService.getAllGroundWaterData();

    let avgWaterLevel = 0;
    let avgWaterPressure = 0;

    if (dataList.length > 0) {
      avgWaterLevel = dataList.reduce((sum, d) => sum + (d.waterLevel || 0), 0) / dataList.length;
      avgWaterPressure = dataList.reduce((sum, d) => sum + (d.waterPressure || 0), 0) / dataList.length;
    }

    const pressureDistribution = this.calculatePressureDistribution(dataList);

    return {
      waterLevel: avgWaterLevel,
      waterPressure: avgWaterPressure,
      pressureDistribution,
    };
  }

  private calculatePressureDistribution(dataList: IGroundWater[]): number[][] {
    const gridSize = 10;
    const distribution: number[][] = [];

    for (let i = 0; i < gridSize; i++) {
      distribution[i] = new Array(gridSize).fill(0);
    }

    if (dataList.length === 0) {
      return distribution;
    }

    const minX = Math.min(...dataList.map(d => d.x || 0));
    const maxX = Math.max(...dataList.map(d => d.x || 0));
    const minZ = Math.min(...dataList.map(d => d.z || 0));
    const maxZ = Math.max(...dataList.map(d => d.z || 0));

    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;

    for (const data of dataList) {
      const xIdx = Math.min(
        Math.floor(((data.x || 0) - minX) / rangeX * gridSize),
        gridSize - 1
      );
      const zIdx = Math.min(
        Math.floor(((data.z || 0) - minZ) / rangeZ * gridSize),
        gridSize - 1
      );
      distribution[xIdx][zIdx] = data.waterPressure || 0;
    }

    return distribution;
  }

  convertSensorDataToDTO(sensorData: ISensorData[]): StressDataDTO {
    const tbmService = getTBMService();
    const mileage = (tbmService as any).currentStatus?.totalDistance || 0;

    const stressValues = sensorData
      .filter(s => typeof s.stress === 'number')
      .map(s => s.stress!);

    const stressDistribution = this.calculateStressDistribution(sensorData, mileage);

    return {
      segmentId: Math.floor(mileage / 10),
      position: mileage,
      maxStress: stressValues.length > 0 ? Math.max(...stressValues) : 0,
      minStress: stressValues.length > 0 ? Math.min(...stressValues) : 0,
      avgStress: stressValues.length > 0
        ? stressValues.reduce((a, b) => a + b, 0) / stressValues.length
        : 0,
      stressDistribution,
    };
  }
}

let realtimeDataServiceInstance: RealtimeDataService | null = null;

export function getRealtimeDataService(): RealtimeDataService {
  if (!realtimeDataServiceInstance) {
    realtimeDataServiceInstance = new RealtimeDataService();
  }
  return realtimeDataServiceInstance;
}

export default RealtimeDataService;
