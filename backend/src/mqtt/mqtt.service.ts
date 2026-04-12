import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as mqtt from 'mqtt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppGateway } from '../gateway/app.gateway';

import { Device } from '../entities/device.entity';
import { SensorReading } from '../entities/sensor-reading.entity';
import { ActionLog } from '../entities/action-log.entity';

@Injectable()
export class MqttService implements OnModuleInit {
  private client: mqtt.MqttClient;

  // 🌟 RAM ẢO - Sổ tay nhớ Cửa mở
  private doorTimers = new Map<number, NodeJS.Timeout>();

  // 🌟 RAM ẢO - Sổ tay nhớ lệnh "Nhường quyền cho sếp" (Cooldown)
  private manualOverrides = new Map<number, number>();

  constructor(
    @InjectRepository(Device) private deviceRepo: Repository<Device>,
    @InjectRepository(SensorReading)
    private readingRepo: Repository<SensorReading>,
    @InjectRepository(ActionLog) private logRepo: Repository<ActionLog>,
    private appGateway: AppGateway,
  ) {}

  onModuleInit() {
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
    const adafruitUser = process.env.ADAFRUIT_USERNAME;
    const adafruitKey = process.env.ADAFRUIT_KEY;

    this.client = mqtt.connect('mqtt://io.adafruit.com', {
      clientId,
      username: adafruitUser,
      password: adafruitKey,
    });

    this.client.on('connect', () => {
      console.log('Đã kết nối MQTT Adafruit thành công!');
      this.client.subscribe(`${adafruitUser}/feeds/+`);
    });

    // ==========================================
    // LOGIC XỬ LÝ SỰ KIỆN TỪ YOLO:BIT
    // ==========================================
    this.client.on('message', async (topic, payload) => {
      const feedKey = topic.split('/').pop();
      const value = payload.toString();

      if (!isNaN(Number(feedKey))) return;
      console.log(`Nhận data từ [${feedKey}]: ${value}`);

      const numericValue = parseFloat(value);

      // 1. TÌM THIẾT BỊ TRONG DATABASE
      const device = await this.deviceRepo.findOne({
        where: { adafruit_feed_key: feedKey },
        relations: ['area', 'area.current_food_type'],
      });

      if (!device) return;

      const area = device.area;
      const areaId = area?.id;

      // Realtime Update Giao Diện
      this.appGateway.emitRealtimeData('live_sensor_data', {
        khu_vuc: area ? area.area_name : 'Không xác định',
        thiet_bi: feedKey,
        loai_cam_bien: device.device_type,
        gia_tri: value,
      });

      // ==========================================
      // 2. NGHIỆP VỤ NÚT BẤM DẠNG CHỮ (CỬA, SOS, ĐIỀU KHIỂN)
      // ==========================================
      if (isNaN(numericValue)) {
        device.status = value;
        await this.deviceRepo.save(device);

        // 🚪 LOGIC CẢM BIẾN CỬA (Có nhớ quá khứ 30s)
        if (device.device_type === 'DOOR_SENSOR' && areaId) {
          if (value === '1' || value === 'ON') {
            console.log(`🚪 Cửa khu vực [${area.area_name}] ĐANG MỞ!`);
            this.publishToAdafruit('den1', 'MODE_1');

            if (!this.doorTimers.has(areaId)) {
              const timeoutSec = (area as any).auto_door_timeout_sec || 30;

              const timer = setTimeout(() => {
                console.log(
                  `🚨 Cảnh báo: Cửa [${area.area_name}] mở quá ${timeoutSec} giây!`,
                );
                this.publishToAdafruit('led_matrix', 'YELLOW_BLINK');

                this.logRepo.save(
                  this.logRepo.create({
                    action_type: 'DOOR_WARNING',
                    action_value: `Cửa mở quá ${timeoutSec}s, đã kích hoạt báo động!`,
                    trigger_source: 'AUTO',
                    area: area,
                    device: device,
                  }),
                );
              }, timeoutSec * 1000);

              this.doorTimers.set(areaId, timer);
            }
          } else if (value === '0' || value === 'OFF') {
            console.log(`✅ Cửa khu vực [${area.area_name}] Đã đóng.`);
            this.publishToAdafruit('den1', 'OFF');
            this.publishToAdafruit('led_matrix', 'GREEN');

            if (this.doorTimers.has(areaId)) {
              clearTimeout(this.doorTimers.get(areaId));
              this.doorTimers.delete(areaId);
            }
          }
        }

        // 🚨 NÚT KHẨN CẤP SOS
        if (device.device_type === 'EMERGENCY_BTN') {
          if (value === '1' || value === 'ON') {
            console.log(`KHẨN CẤP! Báo động tại [${area?.area_name}]!`);
            this.publishToAdafruit('led_matrix', 'RED_BLINK');
            this.logRepo.save(
              this.logRepo.create({
                action_type: 'EMERGENCY_SOS',
                action_value: 'Kích hoạt báo động khẩn cấp SOS',
                trigger_source: 'MANUAL',
                area: area,
                device: device,
              }),
            );
          } else {
            console.log(`Đã HỦY báo động khẩn cấp tại [${area?.area_name}].`);
            this.publishToAdafruit('led_matrix', 'GREEN');
          }
        }

        return;
      }

      // ==========================================
      // 3. NGHIỆP VỤ CẢM BIẾN SỐ & LOGIC AUTO (QUẠT)
      // ==========================================
      const newReading = this.readingRepo.create({
        device: device,
        sensor_type: device.device_type,
        reading_value: numericValue,
      });
      await this.readingRepo.save(newReading);

      if (
        (device.device_type === 'TEMP' || device.device_type === 'HUMI') &&
        areaId
      ) {
        if (!area || !area.current_food_type) return;
        const foodType = area.current_food_type;

        let isOverheating = false;
        if (device.device_type === 'TEMP') {
          isOverheating =
            numericValue > foodType.max_temp ||
            numericValue < foodType.min_temp;
        }

        if (isOverheating) {
          // ⚔️ PHÂN XỬ QUYỀN LỰC AUTO VS MANUAL Ở ĐÂY
          const opMode = (area as any).operating_mode || 'AUTO';

          if (opMode === 'MANUAL') {
            console.log(
              `[Khu ${areaId}] Quá nhiệt nhưng đang MANUAL. Auto không can thiệp.`,
            );
          } else {
            const expireTime = this.manualOverrides.get(areaId);

            if (expireTime && Date.now() < expireTime) {
              const remainingMins = Math.round(
                (expireTime - Date.now()) / 60000,
              );
              console.log(
                `[Khu ${areaId}] Quá nhiệt nhưng Sếp đang chiếm quyền. Auto đi ngủ thêm ${remainingMins} phút nữa.`,
              );
            } else {
              // ✅ Sếp cho phép -> Auto ra tay
              if (this.manualOverrides.has(areaId))
                this.manualOverrides.delete(areaId);

              console.log(
                `🔥 QUÁ NHIỆT! Khu vực [${area.area_name}] vượt ngưỡng! Auto đang can thiệp...`,
              );

              this.publishToAdafruit('quat1', 'ON');
              this.publishToAdafruit('led_matrix', 'RED_BLINK');

              await this.logRepo.save(
                this.logRepo.create({
                  action_type: 'TEMP_ALERT',
                  action_value: `Vượt ngưỡng (${numericValue}°C). Auto đã bật Quạt.`,
                  trigger_source: 'AUTO',
                  area: area,
                  device: device,
                }),
              );
            }
          }
        }
      }
    }); // <-- Kết thúc sự kiện this.client.on('message')
  } // <-- Kết thúc hàm onModuleInit()

  // ==========================================
  // HÀM MỚI: KÍCH HOẠT NHƯỜNG QUYỀN CHO SẾP (MANUAL COOLDOWN)
  // ==========================================
  public setManualCooldown(areaId: number, cooldownMins: number = 30) {
    const expireTime = Date.now() + cooldownMins * 60 * 1000;
    this.manualOverrides.set(areaId, expireTime);
    console.log(
      `🖐️ Kích hoạt Ghi đè thủ công cho Khu [${areaId}] trong ${cooldownMins} phút. Auto sẽ tạm dừng.`,
    );
  }

  // ==========================================
  // ẢO HÓA DỮ LIỆU: CẢM BIẾN CO2
  // ==========================================
  @Cron(CronExpression.EVERY_MINUTE)
  async simulateCO2Sensor() {
    const virtualSensors = await this.deviceRepo.find({
      where: { device_type: 'CO2_SENSOR' },
      relations: ['area'],
    });
    if (virtualSensors.length === 0) return;

    virtualSensors.forEach(async (sensor) => {
      const randomCO2 = Math.floor(Math.random() * (450 - 350 + 1)) + 350;
      await this.readingRepo.save(
        this.readingRepo.create({
          device: sensor,
          sensor_type: 'CO2',
          reading_value: randomCO2,
        }),
      );

      this.appGateway.emitRealtimeData('live_sensor_data', {
        khu_vuc: sensor.area ? sensor.area.area_name : 'Khu vực Ảo',
        thiet_bi: sensor.adafruit_feed_key,
        loai_cam_bien: 'CO2',
        gia_tri: randomCO2,
      });
    });
  }

  publishToAdafruit(feedKey: string, value: string) {
    const adafruitUser = process.env.ADAFRUIT_USERNAME;
    if (!adafruitUser) return;
    this.client.publish(`${adafruitUser}/feeds/${feedKey}`, value);
  }
}
