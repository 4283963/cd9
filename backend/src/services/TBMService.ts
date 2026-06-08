import { Repository } from 'typeorm';
import { TBMStatus, ITBMStatus } from '../models';
import { getDataSource } from '../database';

export class TBMService {
  private repository: Repository<TBMStatus>;
  private currentStatus: ITBMStatus | null = null;

  constructor() {
    this.repository = getDataSource().getRepository(TBMStatus);
  }

  async updateStatus(status: ITBMStatus): Promise<TBMStatus> {
    const tbmStatus = this.repository.create({
      ...status,
      timestamp: status.timestamp || Date.now(),
    });
    const saved = await this.repository.save(tbmStatus);
    this.currentStatus = saved;
    return saved;
  }

  async getCurrentStatus(): Promise<ITBMStatus | null> {
    if (this.currentStatus) {
      return this.currentStatus;
    }

    const latestList = await this.repository.find({
      order: { timestamp: 'DESC' },
      take: 1,
    });

    const latest = latestList.length > 0 ? latestList[0] : null;

    if (latest) {
      this.currentStatus = latest;
    }

    return this.currentStatus;
  }

  async getStatusHistory(
    startTime?: number,
    endTime?: number,
    limit: number = 1000,
    offset: number = 0
  ): Promise<TBMStatus[]> {
    const queryBuilder = this.repository.createQueryBuilder('tbm_status')
      .orderBy('tbm_status.timestamp', 'DESC')
      .limit(limit)
      .offset(offset);

    if (startTime) {
      queryBuilder.andWhere('tbm_status.timestamp >= :startTime', { startTime });
    }
    if (endTime) {
      queryBuilder.andWhere('tbm_status.timestamp <= :endTime', { endTime });
    }

    return await queryBuilder.getMany();
  }

  async getLatestStatus(limit: number = 10): Promise<TBMStatus[]> {
    return await this.repository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getStatusStats(startTime?: number, endTime?: number): Promise<{
    count: number;
    avgExcavationSpeed: number;
    avgCutterHeadSpeed: number;
    avgThrustForce: number;
    avgTorque: number;
    maxExcavationSpeed: number;
    maxCutterHeadSpeed: number;
    totalDistance: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('tbm_status')
      .select('COUNT(*)', 'count')
      .addSelect('AVG(tbm_status.excavation_speed)', 'avgExcavationSpeed')
      .addSelect('AVG(tbm_status.cutter_head_speed)', 'avgCutterHeadSpeed')
      .addSelect('AVG(tbm_status.thrust_force)', 'avgThrustForce')
      .addSelect('AVG(tbm_status.torque)', 'avgTorque')
      .addSelect('MAX(tbm_status.excavation_speed)', 'maxExcavationSpeed')
      .addSelect('MAX(tbm_status.cutter_head_speed)', 'maxCutterHeadSpeed');

    if (startTime) {
      queryBuilder.andWhere('tbm_status.timestamp >= :startTime', { startTime });
    }
    if (endTime) {
      queryBuilder.andWhere('tbm_status.timestamp <= :endTime', { endTime });
    }

    const result = await queryBuilder.getRawOne();

    const latestStatusList = await this.repository.find({
      order: { timestamp: 'DESC' },
      select: { totalDistance: true } as any,
      take: 1,
    });
    const latestStatus = latestStatusList.length > 0 ? latestStatusList[0] : null;

    return {
      count: parseInt(result.count, 10) || 0,
      avgExcavationSpeed: parseFloat(result.avgExcavationSpeed) || 0,
      avgCutterHeadSpeed: parseFloat(result.avgCutterHeadSpeed) || 0,
      avgThrustForce: parseFloat(result.avgThrustForce) || 0,
      avgTorque: parseFloat(result.avgTorque) || 0,
      maxExcavationSpeed: parseFloat(result.maxExcavationSpeed) || 0,
      maxCutterHeadSpeed: parseFloat(result.maxCutterHeadSpeed) || 0,
      totalDistance: latestStatus?.totalDistance || 0,
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

  setCurrentStatus(status: ITBMStatus): void {
    this.currentStatus = status;
  }
}

let tbmServiceInstance: TBMService | null = null;

export function getTBMService(): TBMService {
  if (!tbmServiceInstance) {
    tbmServiceInstance = new TBMService();
  }
  return tbmServiceInstance;
}
