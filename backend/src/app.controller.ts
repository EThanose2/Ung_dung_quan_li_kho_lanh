import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SensorReading } from './entities/sensor-reading.entity';
import { ActionLog } from './entities/action-log.entity';
import { Device } from './entities/device.entity';
import { MqttService } from './mqtt/mqtt.service';

@Controller('api')
export class AppController {
  constructor(
    @InjectRepository(SensorReading)
    private readonly sensorRepo: Repository<SensorReading>,

    @InjectRepository(ActionLog)
    private readonly actionLogRepo: Repository<ActionLog>,

    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,

    private readonly mqttService: MqttService,
  ) {}

  // ====================================================
  // API 1: LẤY SỐ MỚI NHẤT
  // Đường dẫn: GET /api/sensors/latest
  // ====================================================
  @Get('sensors/latest')
  async getLatestReadings() {
    const data = await this.sensorRepo.find({
      order: { recorded_at: 'DESC' },
      take: 5,
    });
    return { status: 'success', data };
  }

  // ====================================================
  // API 2: LẤY LỊCH SỬ ĐỂ VẼ BIỂU ĐỒ (Chart)
  // Đường dẫn: GET /api/sensors/history?type=TEMP&limit=20
  // ====================================================
  @Get('sensors/history')
  async getHistory(
    @Query('type') type: string,
    @Query('limit') limit: number = 20,
  ) {
    let query = this.sensorRepo
      .createQueryBuilder('sensor')
      .orderBy('sensor.recorded_at', 'ASC');

    if (type) {
      query = query.where('sensor.sensor_type = :type', { type });
    }

    const data = await query.take(limit).getMany();
    return { status: 'success', data };
  }

  // ====================================================
  // API 3: BẤM NÚT ĐIỀU KHIỂN (Đã fix khớp Entity)
  // Đường dẫn: POST /api/devices/control
  // ====================================================
  @Post('devices/control')
  async controlDevice(@Body() body: { device_id: string; action: string }) {
    const { device_id, action } = body;
    const value = action === 'TURN_ON' ? 'ON' : 'OFF';

    // 1. Kêu MqttService bắn lệnh lên Adafruit
    this.mqttService.publishToAdafruit(device_id, value);

    // 2. Tìm ID của thiết bị trong DB
    const device = await this.deviceRepo.findOne({
      where: { adafruit_feed_key: device_id },
    });

    if (!device) {
      return {
        status: 'error',
        message: 'Không tìm thấy thiết bị này trong kho!',
      };
    }

    const newLog = this.actionLogRepo.create({
      device: device, // Khóa ngoại móc thẳng vô Object Device
      action_type: 'MANUAL_CONTROL',
      action_value: `Lệnh ${action} thiết bị từ Web`,
    });

    await this.actionLogRepo.save(newLog);

    return {
      status: 'success',
      message: `Đã xử lý lệnh ${action} cho ${device_id}!`,
    };
  }
}
