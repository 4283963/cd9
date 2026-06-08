import { Repository } from 'typeorm';
import { SensorData, ISensorData } from '../models';
import { getDataSource } from '../database';

export class SensorService {
  private repository: Repository<SensorData>;

  constructor() {
    this.repository = getDataSource().getRepository(SensorData);
  }

  async addSensorData(data: ISensorData): Promise<SensorData> {
    const sensorData = this.repository.create({
      ...data,
      timestamp: data.timestamp || Date.now(),
    });
    return await this.repository.save(sensorData);
  }

  async addSensorDataBatch(dataList: ISensorData[]): Promise<SensorData[]> {
    const sensorDataList = dataList.map(data =>
      this.repository.create({
        ...data,
        timestamp: data.timestamp || Date.now(),
      })
    );
    return await this.repository.save(sensorDataList);
  }

  async getSensorHistory(
    startTime?: number,
    endTime?: number,
    limit: number = 1000,
    offset: number = 0
  ): Promise<SensorData[]> {
    const queryBuilder = this.repository.createQueryBuilder('sensor_data')
      .orderBy('sensor_data.timestamp', 'DESC')
      .limit(limit)
      .offset(offset);

    if (startTime) {
      queryBuilder.andWhere('sensor_data.timestamp >= :startTime', { startTime });
    }
    if (endTime) {
      queryBuilder.andWhere('sensor_data.timestamp <= :endTime', { endTime });
    }

    return await queryBuilder.getMany();
  }

  async getLatestSensorData(limit: number = 100): Promise<SensorData[]> {
    return await this.repository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getSensorDataById(id: number): Promise<SensorData | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async getSensorDataBySensorId(
    sensorId: string,
    limit: number = 100
  ): Promise<SensorData[]> {
    return await this.repository.find({
      where: { sensorId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getSensorDataStats(startTime?: number, endTime?: number): Promise<{
    count: number;
    avgStress: number;
    avgTemperature: number;
    avgWaterPressure: number;
    minStress: number;
    maxStress: number;
    minTemperature: number;
    maxTemperature: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('sensor_data')
      .select('COUNT(*)', 'count')
      .addSelect('AVG(sensor_data.stress)', 'avgStress')
      .addSelect('AVG(sensor_data.temperature)', 'avgTemperature')
      .addSelect('AVG(sensor_data.water_pressure)', 'avgWaterPressure')
      .addSelect('MIN(sensor_data.stress)', 'minStress')
      .addSelect('MAX(sensor_data.stress)', 'maxStress')
      .addSelect('MIN(sensor_data.temperature)', 'minTemperature')
      .addSelect('MAX(sensor_data.temperature)', 'maxTemperature');

    if (startTime) {
      queryBuilder.andWhere('sensor_data.timestamp >= :startTime', { startTime });
    }
    if (endTime) {
      queryBuilder.andWhere('sensor_data.timestamp <= :endTime', { endTime });
    }

    const result = await queryBuilder.getRawOne();

    return {
      count: parseInt(result.count, 10) || 0,
      avgStress: parseFloat(result.avgStress) || 0,
      avgTemperature: parseFloat(result.avgTemperature) || 0,
      avgWaterPressure: parseFloat(result.avgWaterPressure) || 0,
      minStress: parseFloat(result.minStress) || 0,
      maxStress: parseFloat(result.maxStress) || 0,
      minTemperature: parseFloat(result.minTemperature) || 0,
      maxTemperature: parseFloat(result.maxTemperature) || 0,
    };
  }

  async deleteOldData(beforeTime: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :beforeTime', { beforeTime })
      .execute();

    return result.affected || 0;
  }
}

let sensorServiceInstance: SensorService | null = null;

export function getSensorService(): SensorService {
  if (!sensorServiceInstance) {
    sensorServiceInstance = new SensorService();
  }
  return sensorServiceInstance;
}
