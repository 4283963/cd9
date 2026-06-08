import { Request, Response } from 'express';
import { getSensorService } from '../services';
import { ISensorData } from '../models';

export class SensorController {
  static async addSensorData(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as ISensorData | ISensorData[];

      const sensorService = getSensorService();

      if (Array.isArray(data)) {
        const result = await sensorService.addSensorDataBatch(data);
        res.status(201).json({
          success: true,
          message: `${result.length} sensor data records added successfully`,
          count: result.length,
        });
      } else {
        const result = await sensorService.addSensorData(data);
        res.status(201).json({
          success: true,
          message: 'Sensor data added successfully',
          data: result,
        });
      }
    } catch (error) {
      console.error('Error adding sensor data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add sensor data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getSensorHistory(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime, limit, offset } = req.query;

      const sensorService = getSensorService();
      const data = await sensorService.getSensorHistory(
        startTime ? parseInt(startTime as string, 10) : undefined,
        endTime ? parseInt(endTime as string, 10) : undefined,
        limit ? parseInt(limit as string, 10) : 1000,
        offset ? parseInt(offset as string, 10) : 0
      );

      res.status(200).json({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      console.error('Error getting sensor history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sensor history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getLatestSensorData(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;

      const sensorService = getSensorService();
      const data = await sensorService.getLatestSensorData(
        limit ? parseInt(limit as string, 10) : 100
      );

      res.status(200).json({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      console.error('Error getting latest sensor data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get latest sensor data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getSensorDataById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const sensorService = getSensorService();
      const data = await sensorService.getSensorDataById(parseInt(id, 10));

      if (!data) {
        res.status(404).json({
          success: false,
          message: 'Sensor data not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error getting sensor data by id:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sensor data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getSensorStats(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime } = req.query;

      const sensorService = getSensorService();
      const stats = await sensorService.getSensorDataStats(
        startTime ? parseInt(startTime as string, 10) : undefined,
        endTime ? parseInt(endTime as string, 10) : undefined
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting sensor stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sensor statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default SensorController;
