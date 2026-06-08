import { Request, Response } from 'express';
import { getRockLayerService } from '../services';
import { IRockLayer } from '../models';

export class RockLayerController {
  static async getAllRockLayers(req: Request, res: Response): Promise<void> {
    try {
      const rockLayerService = getRockLayerService();
      const data = await rockLayerService.getAllRockLayers();

      res.status(200).json({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      console.error('Error getting rock layers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get rock layers',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getRockLayerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const rockLayerService = getRockLayerService();
      const data = await rockLayerService.getRockLayerById(parseInt(id, 10));

      if (!data) {
        res.status(404).json({
          success: false,
          message: 'Rock layer not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error getting rock layer by id:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get rock layer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getRockLayerByDepth(req: Request, res: Response): Promise<void> {
    try {
      const { depth } = req.query;

      if (!depth) {
        res.status(400).json({
          success: false,
          message: 'Depth parameter is required',
        });
        return;
      }

      const rockLayerService = getRockLayerService();
      const data = await rockLayerService.getRockLayerByDepth(parseFloat(depth as string));

      if (!data) {
        res.status(404).json({
          success: false,
          message: 'No rock layer found at given depth',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error getting rock layer by depth:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get rock layer by depth',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async addRockLayer(req: Request, res: Response): Promise<void> {
    try {
      const layer = req.body as IRockLayer;

      const rockLayerService = getRockLayerService();
      const result = await rockLayerService.addRockLayer(layer);

      res.status(201).json({
        success: true,
        message: 'Rock layer added successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error adding rock layer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add rock layer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async addRockLayers(req: Request, res: Response): Promise<void> {
    try {
      const layers = req.body as IRockLayer[];

      const rockLayerService = getRockLayerService();
      const result = await rockLayerService.addRockLayers(layers);

      res.status(201).json({
        success: true,
        message: `${result.length} rock layers added successfully`,
        count: result.length,
      });
    } catch (error) {
      console.error('Error adding rock layers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add rock layers',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async updateRockLayer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const layer = req.body as Partial<IRockLayer>;

      const rockLayerService = getRockLayerService();
      const result = await rockLayerService.updateRockLayer(parseInt(id, 10), layer);

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Rock layer not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Rock layer updated successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error updating rock layer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update rock layer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async deleteRockLayer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const rockLayerService = getRockLayerService();
      const success = await rockLayerService.deleteRockLayer(parseInt(id, 10));

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Rock layer not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Rock layer deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting rock layer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete rock layer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default RockLayerController;
