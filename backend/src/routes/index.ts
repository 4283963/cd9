import { Router } from 'express';
import {
  SensorController,
  TBMController,
  RockLayerController,
  GroundWaterController,
  RealtimeDataController,
} from '../controllers';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '地下矿道三维掘进数字孪生系统 API',
    version: '1.0.0',
    endpoints: {
      sensor: '/api/sensor',
      tbm: '/api/tbm',
      'rock-layers': '/api/rock-layers',
      groundwater: '/api/groundwater',
      realtime: '/api/realtime',
    },
  });
});

router.get('/realtime', RealtimeDataController.getRealtimeData);
router.get('/realtime/tbm', RealtimeDataController.getTBMStatusDTO);
router.get('/realtime/stress', RealtimeDataController.getStressDataDTO);
router.get('/realtime/rocklayers', RealtimeDataController.getRockLayersDTO);
router.get('/realtime/groundwater', RealtimeDataController.getGroundWaterDTO);

router.post('/sensor', SensorController.addSensorData);
router.get('/sensor/history', SensorController.getSensorHistory);
router.get('/sensor/latest', SensorController.getLatestSensorData);
router.get('/sensor/stats', SensorController.getSensorStats);
router.get('/sensor/:id', SensorController.getSensorDataById);

router.get('/tbm/status', TBMController.getCurrentStatus);
router.put('/tbm/status', TBMController.updateStatus);
router.get('/tbm/history', TBMController.getStatusHistory);
router.get('/tbm/latest', TBMController.getLatestStatus);
router.get('/tbm/stats', TBMController.getStatusStats);

router.get('/rock-layers', RockLayerController.getAllRockLayers);
router.post('/rock-layers', RockLayerController.addRockLayer);
router.post('/rock-layers/batch', RockLayerController.addRockLayers);
router.get('/rock-layers/depth', RockLayerController.getRockLayerByDepth);
router.get('/rock-layers/:id', RockLayerController.getRockLayerById);
router.put('/rock-layers/:id', RockLayerController.updateRockLayer);
router.delete('/rock-layers/:id', RockLayerController.deleteRockLayer);

router.get('/groundwater', GroundWaterController.getAllGroundWaterData);
router.post('/groundwater', GroundWaterController.addGroundWaterData);
router.get('/groundwater/history', GroundWaterController.getGroundWaterHistory);
router.get('/groundwater/stats', GroundWaterController.getGroundWaterStats);
router.get('/groundwater/zone/:zoneId', GroundWaterController.getGroundWaterByZone);
router.get('/groundwater/:id', GroundWaterController.getGroundWaterById);

export default router;
