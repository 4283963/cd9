import { Request, Response } from 'express';
import { getTBMService } from '../services';
import { ITBMStatus } from '../models';

export class TBMController {
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = req.body as ITBMStatus;

      const tbmService = getTBMService();
      const result = await tbmService.updateStatus(status);

      res.status(200).json({
        success: true,
        message: 'TBM status updated successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error updating TBM status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update TBM status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getCurrentStatus(req: Request, res: Response): Promise<void> {
    try {
      const tbmService = getTBMService();
      const status = await tbmService.getCurrentStatus();

      if (!status) {
        res.status(404).json({
          success: false,
          message: 'TBM status not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error('Error getting TBM status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get TBM status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getStatusHistory(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime, limit, offset } = req.query;

      const tbmService = getTBMService();
      const data = await tbmService.getStatusHistory(
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
      console.error('Error getting TBM status history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get TBM status history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getLatestStatus(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;

      const tbmService = getTBMService();
      const data = await tbmService.getLatestStatus(
        limit ? parseInt(limit as string, 10) : 10
      );

      res.status(200).json({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      console.error('Error getting latest TBM status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get latest TBM status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getStatusStats(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime } = req.query;

      const tbmService = getTBMService();
      const stats = await tbmService.getStatusStats(
        startTime ? parseInt(startTime as string, 10) : undefined,
        endTime ? parseInt(endTime as string, 10) : undefined
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting TBM status stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get TBM statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default TBMController;
