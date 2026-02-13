import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Store } from "./entities/store.entity";
import { CreateStoreDto } from "./dto/create-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const store = this.storeRepository.create(createStoreDto);
    return await this.storeRepository.save(store);
  }

  async findAll(): Promise<Store[]> {
    return await this.storeRepository.find({
      relations: ["city"],
      where: { activo: true },
      order: { nombre: "ASC" },
    });
  }

  async findByCity(cityId: number): Promise<Store[]> {
    return await this.storeRepository.find({
      where: {
        id_ciudad: cityId,
        activo: true,
      },
      relations: ["city"],
      order: { nombre: "ASC" },
    });
  }

  async findOne(id: number): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id_local: id },
      relations: ["city"],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  async update(id: number, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const store = await this.findOne(id);
    Object.assign(store, updateStoreDto);
    return await this.storeRepository.save(store);
  }

  async remove(id: number): Promise<void> {
    const store = await this.findOne(id);
    await this.storeRepository.remove(store);
  }

  async seedStores(): Promise<void> {
    const existingStores = await this.storeRepository.count();
    if (existingStores > 0) {
      return; // Ya existen stores, no hacer seed
    }

    const storesData = [
      // Locales en Manta (id_ciudad: 1)
      {
        nombre: "Pop2Go Centro Manta",
        direccion: "Av. 4 de Noviembre y Calle 13, Centro",
        telefono: "05-2345678",
        descripcion: "Local principal en el centro de Manta",
        hora_apertura: "08:00",
        hora_cierre: "22:00",
        latitude: -0.9677,
        longitude: -80.7089,
        id_ciudad: 1,
        activo: true,
      },
      {
        nombre: "Pop2Go Mall del Pacífico",
        direccion: "Mall del Pacífico, Local 205",
        telefono: "05-2345679",
        descripcion: "Sucursal en Mall del Pacífico",
        hora_apertura: "10:00",
        hora_cierre: "21:00",
        latitude: -0.9534,
        longitude: -80.7267,
        id_ciudad: 1,
        activo: true,
      },
      {
        nombre: "Pop2Go Barbasquillo",
        direccion: "Av. Barbasquillo, Sector Playita Mía",
        telefono: "05-2345680",
        descripcion: "Local en la zona turística de Barbasquillo",
        hora_apertura: "09:00",
        hora_cierre: "23:00",
        latitude: -0.9234,
        longitude: -80.7456,
        id_ciudad: 1,
        activo: true,
      },
      {
        nombre: "Pop2Go Los Esteros",
        direccion: "Av. Los Esteros y Calle 24",
        telefono: "05-2345681",
        descripcion: "Sucursal en Los Esteros",
        hora_apertura: "08:30",
        hora_cierre: "21:30",
        latitude: -0.9789,
        longitude: -80.7123,
        id_ciudad: 1,
        activo: true,
      },
      {
        nombre: "Pop2Go Eloy Alfaro",
        direccion: "Av. Eloy Alfaro y Calle 105",
        telefono: "05-2345682",
        descripcion: "Local en la Av. Eloy Alfaro",
        hora_apertura: "07:00",
        hora_cierre: "22:30",
        latitude: -0.9456,
        longitude: -80.7234,
        id_ciudad: 1,
        activo: true,
      },
      // Locales en Portoviejo (id_ciudad: 2)
      {
        nombre: "Pop2Go Centro Portoviejo",
        direccion: "Calle Olmedo y 10 de Agosto, Centro",
        telefono: "05-2654321",
        descripcion: "Local principal en el centro de Portoviejo",
        hora_apertura: "08:00",
        hora_cierre: "22:00",
        latitude: -1.0548,
        longitude: -80.4545,
        id_ciudad: 2,
        activo: true,
      },
      {
        nombre: "Pop2Go Paseo Shopping",
        direccion: "Paseo Shopping Portoviejo, Local 156",
        telefono: "05-2654322",
        descripcion: "Sucursal en Paseo Shopping",
        hora_apertura: "10:00",
        hora_cierre: "21:00",
        latitude: -1.0423,
        longitude: -80.4612,
        id_ciudad: 2,
        activo: true,
      },
      {
        nombre: "Pop2Go Universidad",
        direccion: "Av. Universitaria, frente a UNESUM",
        telefono: "05-2654323",
        descripcion: "Local cerca de la zona universitaria",
        hora_apertura: "07:30",
        hora_cierre: "23:00",
        latitude: -1.0634,
        longitude: -80.4389,
        id_ciudad: 2,
        activo: true,
      },
      {
        nombre: "Pop2Go Colón",
        direccion: "Av. Colón y Calle Sucre",
        telefono: "05-2654324",
        descripcion: "Sucursal en la Av. Colón",
        hora_apertura: "08:30",
        hora_cierre: "21:30",
        latitude: -1.0512,
        longitude: -80.4478,
        id_ciudad: 2,
        activo: true,
      },
    ];

    for (const storeData of storesData) {
      const store = this.storeRepository.create(storeData);
      await this.storeRepository.save(store);
    }
  }
}
