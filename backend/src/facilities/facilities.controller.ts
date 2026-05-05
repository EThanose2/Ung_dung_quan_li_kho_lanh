import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query
} from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import { Warehouse } from '../entities/warehouse.entity';
import { Area } from '../entities/area.entity';
import { FoodType } from '../entities/food-type.entity';
import { Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller('api')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  // ==================== WAREHOUSE CRUD ====================

  @Get('warehouses')
async getAllWarehouses(@Query('user_id') userId?: string) {
  const data = userId
    ? await this.facilitiesService.getWarehousesByOperator(Number(userId))
    : await this.facilitiesService.getAllWarehouses();
  return { status: 'success', data };
}

  // ⚠️ Phải đặt TRƯỚC :id để tránh nhầm 'dashboard' thành id
  @Get('warehouses/dashboard')
  async getDashboard() {
    return {
      status: 'success',
      data: await this.facilitiesService.getDashboardData(),
    };
  }
 
  @Get('warehouses/:id')
  async getWarehouseById(@Param('id') id: number) {
    return {
      status: 'success',
      data: await this.facilitiesService.getWarehouseById(id),
    };
  }

  @Post('warehouses')
  async createWarehouse(@Body() body: Partial<Warehouse>) {
    return {
      status: 'success',
      data: await this.facilitiesService.createWarehouse(body),
    };
  }

  @Put('warehouses/:id')
  async updateWarehouse(
    @Param('id') id: number,
    @Body() body: Partial<Warehouse>,
  ) {
    return {
      status: 'success',
      data: await this.facilitiesService.updateWarehouse(id, body),
    };
  }

  @Delete('warehouses/:id')
  async deleteWarehouse(@Param('id') id: number) {
    await this.facilitiesService.deleteWarehouse(id);
    return { status: 'success', message: 'Đã xóa kho lạnh' };
  }

  // ==================== AREA ====================

  @Get('areas')
  async getAllAreas() {
    return {
      status: 'success',
      data: await this.facilitiesService.getAllAreas(),
    };
  }

  @Post('areas')
  async createArea(@Body() body: Partial<Area>) {
    return {
      status: 'success',
      data: await this.facilitiesService.createArea(body),
    };
  }

  @Delete('areas/:id')
  async deleteArea(@Param('id') id: number) {
    await this.facilitiesService.deleteArea(id);
    return { status: 'success', message: 'Đã xóa khu vực' };
  }

  @Put('areas/:id/settings')
  async updateAreaSettings(@Param('id') id: number, @Body() body: any) {
    const data = await this.facilitiesService.updateAreaSettings(id, body);
    return { status: 'success', message: 'Đã cập nhật Khu vực!', data };
  }

  @Post('areas/:id/assign-operator')
  async assignOperator(
    @Param('id') areaId: number,
    @Body('user_id') userId: number,
  ) {
    const res = await this.facilitiesService.assignOperator(areaId, userId);
    return {
      status: 'success',
      message: `Đã gán ${res.user} vào khu ${res.area}`,
    };
  }
  @Post('areas/:id/add-food')
  async addFood(
    @Param('id') id: number,
    @Body('food_type_id') foodTypeId: number,
  ) {
    return await this.facilitiesService.addFoodToArea(id, foodTypeId);
  }
  // ==================== FOOD TYPES ====================

  @Get('food-types')
  async getFoodTypes() {
    return {
      status: 'success',
      data: await this.facilitiesService.getAllFoodTypes(),
    };
  }

  @Post('food-types')
  async createFoodType(@Body() body: Partial<FoodType>) {
    return {
      status: 'success',
      data: await this.facilitiesService.createFoodType(body),
    };
  }

  @Put('food-types/:id')
  async updateFoodType(
    @Param('id') id: number,
    @Body() body: Partial<FoodType>,
  ) {
    await this.facilitiesService.updateFoodType(id, body);
    return { status: 'success', message: 'Đã cập nhật quy tắc bảo quản' };
  }

  @Delete('food-types/:id')
  async deleteFoodType(@Param('id') id: number) {
    await this.facilitiesService.deleteFoodType(id);
    return { status: 'success', message: 'Đã xóa loại thực phẩm' };
  }

  @Put('action-logs/:id/resolve')
  async resolveAlert(
    @Param('id') id: number,
    @Body() body: { note: string; user_id: number }, // Lấy data FE gửi lên
  ) {
    // Gọi xuống service
    return this.facilitiesService.resolveAlert(id, body.note, body.user_id);
  }
}