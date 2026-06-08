import { Request, Response } from 'express';
import { getGroundWaterService } from '../services';
import { IGroundWater } from '../models';

export class GroundWaterController {
  static async getAllGroundWaterData(req: Request, res: Response): Promise<void> {
    try {
      const groundWaterService = getGroundWaterService();
      const data = await groundWaterService.getAllGroundWaterData();

      res.status(200).json({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      console.error('Error getting groundwater data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get groundwater data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getGroundWaterById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const groundWaterService = getGroundWaterService();
      const data = await groundWaterService.getGroundWaterById(parseInt(id, 10));

      if (!data) {
        res.status(404).json({
          success: false,
          message: 'Groundwater data not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error getting groundwater data by id:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get groundwater data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getGroundWaterHistory(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime, limit } = req.query;

      const groundWaterService = getGroundWaterService();
      const data = await groundWaterService.getGroundWaterHistory(
        startTime ? parseInt(startTime as string, 10) : undefined,
        endTime ? parseInt(endTime as string, 10) : undefined,
        limit ? parseInt(limit as string, 10) : 1000
      );

      res.status(200).json({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      console.error('Error getting groundwater history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get groundwater history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getGroundWaterByZone(req: Request, res: Response): Promise<void> {
    try {
      const { zoneId } = req.params;

      const groundWaterService = getGroundWaterService();
      const data = await groundWaterService.getGroundWaterByZone(zoneId);

      res.status(200).json({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      console.error('Error getting groundwater by zone:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get groundwater data by zone',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async addGroundWaterData(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as IGroundWater | IGroundWater[];

      const groundWaterService = getGroundWaterService();

      if (Array.isArray(data)) {
        const result = await groundWaterService.addGroundWaterDataBatch(data);
        res.status(201).json({
          success: true,
          message: `${result.length} groundwater data records added successfully`,
          count: result.length,
        });
      } else {
        const result = await groundWaterService.addGroundWaterData(data);
        res.status(201).json({
          success: true,
          message: 'Groundwater data added successfully',
          data: result,
        });
      }
    } catch (error) {
      console.error('Error adding groundwater data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add groundwater data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getGroundWaterStats(req: Request, res: Response): Promise<void> {
    try {
      const groundWaterService = getGroundWaterService();
      const stats = await groundWaterService.getGroundWaterStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting groundwater stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get groundwater statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default GroundWaterController;
