import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { StoresService } from "./stores.service";
import { CreateStoreDto } from "./dto/create-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";

@Controller("locales")
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  @Get()
  findAll(@Query("cityId") cityId?: string) {
    if (cityId) {
      return this.storesService.findByCity(parseInt(cityId));
    }
    return this.storesService.findAll();
  }

  @Get("by-city/:id_ciudad")
  findByCity(@Param("id_ciudad", ParseIntPipe) id_ciudad: number) {
    return this.storesService.findByCity(id_ciudad);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.storesService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.storesService.remove(id);
  }

  @Post("seed")
  seedStores() {
    return this.storesService.seedStores();
  }
}
