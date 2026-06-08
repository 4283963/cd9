import { Request, Response } from 'express';
import { getRealtimeDataService } from '../services';

export class RealtimeDataController {
  static async getRealtimeData(req: Request, res: Response): Promise<void> {
    try {
      const realtimeDataService = getRealtimeDataService();
      const data = await realtimeDataService.getRealtimeData();

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error getting realtime data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get realtime data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getTBMStatusDTO(req: Request, res: Response): Promise<void> {
    try {
      const realtimeDataService = getRealtimeDataService();
      const data = await realtimeDataService.getRealtimeData();

      res.status(200).json({
        success: true,
        data: data.tbmStatus,
      });
    } catch (error) {
      console.error('Error getting TBM status DTO:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get TBM status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getStressDataDTO(req: Request, res: Response): Promise<void> {
    try {
      const realtimeDataService = getRealtimeDataService();
      const data = await realtimeDataService.getRealtimeData();

      res.status(200).json({
        success: true,
        data: data.stressData,
      });
    } catch (error) {
      console.error('Error getting stress data DTO:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get stress data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getRockLayersDTO(req: Request, res: Response): Promise<void> {
    try {
      const realtimeDataService = getRealtimeDataService();
      const data = await realtimeDataService.getRealtimeData();

      res.status(200).json({
        success: true,
        data: data.rockLayers,
      });
    } catch (error) {
      console.error('Error getting rock layers DTO:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get rock layers',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getGroundWaterDTO(req: Request, res: Response): Promise<void> {
    try {
      const realtimeDataService = getRealtimeDataService();
      const data = await realtimeDataService.getRealtimeData();

      res.status(200).json({
        success: true,
        data: data.groundWater,
      });
    } catch (error) {
      console.error('Error getting groundwater DTO:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get groundwater data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default RealtimeDataController;
