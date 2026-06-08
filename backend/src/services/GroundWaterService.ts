import { Repository } from 'typeorm';
import { GroundWater, IGroundWater } from '../models';
import { getDataSource } from '../database';

export class GroundWaterService {
  private repository: Repository<GroundWater>;

  constructor() {
    this.repository = getDataSource().getRepository(GroundWater);
  }

  async getAllGroundWaterData(): Promise<GroundWater[]> {
    return await this.repository.find({
      order: { timestamp: 'DESC' },
      take: 1000,
    });
  }

  async getGroundWaterById(id: number): Promise<GroundWater | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async getGroundWaterByZone(zoneId: string): Promise<GroundWater[]> {
    return await this.repository.find({
      where: { zoneId },
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }

  async getGroundWaterHistory(
    startTime?: number,
    endTime?: number,
    limit: number = 1000
  ): Promise<GroundWater[]> {
    const queryBuilder = this.repository.createQueryBuilder('ground_water')
      .orderBy('ground_water.timestamp', 'DESC')
      .limit(limit);

    if (startTime) {
      queryBuilder.andWhere('ground_water.timestamp >= :startTime', { startTime });
    }
    if (endTime) {
      queryBuilder.andWhere('ground_water.timestamp <= :endTime', { endTime });
    }

    return await queryBuilder.getMany();
  }

  async addGroundWaterData(data: IGroundWater): Promise<GroundWater> {
    const groundWater = this.repository.create({
      ...data,
      timestamp: data.timestamp || Date.now(),
    });
    return await this.repository.save(groundWater);
  }

  async addGroundWaterDataBatch(dataList: IGroundWater[]): Promise<GroundWater[]> {
    const groundWaterList = dataList.map(data =>
      this.repository.create({
        ...data,
        timestamp: data.timestamp || Date.now(),
      })
    );
    return await this.repository.save(groundWaterList);
  }

  async getGroundWaterStats(): Promise<{
    count: number;
    avgWaterLevel: number;
    avgWaterPressure: number;
    maxWaterLevel: number;
    minWaterLevel: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('ground_water')
      .select('COUNT(*)', 'count')
      .addSelect('AVG(ground_water.water_level)', 'avgWaterLevel')
      .addSelect('AVG(ground_water.water_pressure)', 'avgWaterPressure')
      .addSelect('MAX(ground_water.water_level)', 'maxWaterLevel')
      .addSelect('MIN(ground_water.water_level)', 'minWaterLevel')
      .getRawOne();

    return {
      count: parseInt(result.count, 10) || 0,
      avgWaterLevel: parseFloat(result.avgWaterLevel) || 0,
      avgWaterPressure: parseFloat(result.avgWaterPressure) || 0,
      maxWaterLevel: parseFloat(result.maxWaterLevel) || 0,
      minWaterLevel: parseFloat(result.minWaterLevel) || 0,
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

let groundWaterServiceInstance: GroundWaterService | null = null;

export function getGroundWaterService(): GroundWaterService {
  if (!groundWaterServiceInstance) {
    groundWaterServiceInstance = new GroundWaterService();
  }
  return groundWaterServiceInstance;
}
