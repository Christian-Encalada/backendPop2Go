import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AddressesService } from "./addresses.service";
import { AddressesController } from "./addresses.controller";
import { Address } from "./entities/address.entity";
import { Store } from "../stores/entities/store.entity";

/**
 * Módulo de Direcciones
 * Gestiona las funcionalidades relacionadas con las direcciones de envío
 */
@Module({
  imports: [TypeOrmModule.forFeature([Address, Store])],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
