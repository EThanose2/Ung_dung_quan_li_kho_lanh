import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorReading } from '../entities/sensor-reading.entity';
import { Device } from '../entities/device.entity'; // GỌI BẢNG DEVICE

@Injectable()
export class MqttService implements OnModuleInit {
  private client: mqtt.MqttClient;

  private readonly AIO_USERNAME = 'USERNAME TRÊN ADAFRUIT';
  private readonly AIO_KEY = 'KEY TRÊN ADAFRUIT'; // Key trên Adafruit
  private readonly BROKER_URL = `mqtts://${this.AIO_USERNAME}:${this.AIO_KEY}@io.adafruit.com`;

  constructor(
    @InjectRepository(SensorReading)
    private sensorRepo: Repository<SensorReading>,

    // QUYỀN TRUY CẬP BẢNG DEVICE
    @InjectRepository(Device)
    private deviceRepo: Repository<Device>,
  ) {}

  onModuleInit() {
    this.connectToAdafruit();
  }

  connectToAdafruit() {
    console.log('Đang kết nối tới Adafruit IO...');
    this.client = mqtt.connect(this.BROKER_URL);

    this.client.on('connect', () => {
      console.log('NestJS đã kết nối Adafruit thành công!');
      const feeds = ['nhietdo1', 'doam1', 'anhsang1', 'den1', 'quat1'];
      feeds.forEach((feed) => {
        this.client.subscribe(`${this.AIO_USERNAME}/f/${feed}`);
      });
      console.log('Đang nhận tín hiệu từ Adafruit...');
    });

    this.client.on('message', (topic, message) => {
      const value = message.toString();

      // Topic nó có dạng: khunglong1lv/f/nhietdo1 -> Cắt ra lấy chữ 'nhietdo1'
      const parts = topic.split('/');
      const feedKey = parts[parts.length - 1];

      console.log(
        `[MQTT -> NodeJS] Nhận dữ liệu từ Feed: ${feedKey} | Value = ${value}`,
      );

      // Chỉ lưu DB nếu nó là 3 cái cảm biến
      if (['nhietdo1', 'doam1', 'anhsang1'].includes(feedKey)) {
        this.saveToDatabase(feedKey, value);
      }
    });

    this.client.on('error', (error) => {
      console.error('Lỗi kết nối MQTT:', error);
    });
  }

  // TÌM ID THIẾT BỊ RỒI LƯU
  private async saveToDatabase(feedKey: string, value: string) {
    try {
      const numValue = parseFloat(value);

      // 1. Chạy xuống DB kiếm xem thiết bị nào có cái mã feedKey này
      const device = await this.deviceRepo.findOne({
        where: { adafruit_feed_key: feedKey },
      });

      // Nếu không tìm thấy do chưa chèn vô database
      if (!device) {
        console.log(
          `Bỏ qua: Không tìm thấy thiết bị nào trong DB có mã '${feedKey}'`,
        );
        return;
      }

      // 2. Nếu tìm thấy, tạo record mới và GẮN LUÔN CÁI DEVICE ĐÓ VÔ
      const newRecord = this.sensorRepo.create({
        reading_value: numValue,
        device: device, // Phép thuật của TypeORM nằm ở dòng này!
      });

      await this.sensorRepo.save(newRecord);
      console.log(
        `LƯU THÀNH CÔNG: Số ${numValue} của thiết bị [${device.device_name}]!`,
      );
    } catch (error) {
      console.error(`Lỗi lưu DB:`, error);
    }
  }

  // Gửi lệnh lên Adafruit
  publishToAdafruit(feedKey: string, value: string) {
    const topic = `${this.AIO_USERNAME}/feeds/${feedKey}`;

    // Bóp cò bắn lên server Adafruit
    this.client.publish(topic, value, (err) => {
      if (err) {
        console.error(`Gửi lệnh thất bại tới ${topic}:`, err);
      } else {
        console.log(`Đã gửi lệnh [${value}] lên feed [${feedKey}] thành công!`);
      }
    });
  }
}
