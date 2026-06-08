import { Repository } from 'typeorm';
import { RockLayer, IRockLayer } from '../models';
import { getDataSource } from '../database';

export class RockLayerService {
  private repository: Repository<RockLayer>;

  constructor() {
    this.repository = getDataSource().getRepository(RockLayer);
  }

  async getAllRockLayers(): Promise<RockLayer[]> {
    return await this.repository.find({
      order: { startDepth: 'ASC' },
    });
  }

  async getRockLayerById(id: number): Promise<RockLayer | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async getRockLayerByDepth(depth: number): Promise<RockLayer | null> {
    return await this.repository
      .createQueryBuilder('rock_layer')
      .where('rock_layer.start_depth <= :depth', { depth })
      .andWhere('rock_layer.end_depth >= :depth', { depth })
      .getOne();
  }

  async addRockLayer(layer: IRockLayer): Promise<RockLayer> {
    const rockLayer = this.repository.create(layer);
    return await this.repository.save(rockLayer);
  }

  async addRockLayers(layers: IRockLayer[]): Promise<RockLayer[]> {
    const rockLayers = layers.map(layer => this.repository.create(layer));
    return await this.repository.save(rockLayers);
  }

  async updateRockLayer(id: number, layer: Partial<IRockLayer>): Promise<RockLayer | null> {
    await this.repository.update(id, layer);
    return await this.repository.findOne({ where: { id } });
  }

  async deleteRockLayer(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  async getRockLayerCount(): Promise<number> {
    return await this.repository.count();
  }
}

let rockLayerServiceInstance: RockLayerService | null = null;

export function getRockLayerService(): RockLayerService {
  if (!rockLayerServiceInstance) {
    rockLayerServiceInstance = new RockLayerService();
  }
  return rockLayerServiceInstance;
}
