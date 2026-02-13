import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/users.entity';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private expo: Expo;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.expo = new Expo();
  }

  /**
   * Envía notificación push a deliveries activos en una ciudad específica
   * @param cityId ID de la ciudad
   * @param title Título de la notificación
   * @param body Cuerpo de la notificación
   * @param data Datos adicionales
   */
  async notifyDeliveriesInCity(
    cityId: number,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      // Buscar deliveries activos en la ciudad con token válido
      const deliveries = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.nombre = :roleName', { roleName: 'repartidor' })
        .andWhere('user.delivery_status = :status', { status: 'approved' })
        .andWhere('user.is_working = :working', { working: true })
        .andWhere('user.id_ciudad = :cityId', { cityId })
        .andWhere('user.expo_push_token IS NOT NULL')
        .select(['user.id_usuario', 'user.nombre', 'user.expo_push_token'])
        .getMany();

      if (deliveries.length === 0) {
        this.logger.warn(`No hay deliveries activos en ciudad ${cityId} para notificar`);
        return;
      }

      // Preparar mensajes
      const messages: ExpoPushMessage[] = [];
      for (const delivery of deliveries) {
        if (!Expo.isExpoPushToken(delivery.expo_push_token)) {
          this.logger.warn(`Token inválido para delivery ${delivery.id_usuario}: ${delivery.expo_push_token}`);
          continue;
        }

        messages.push({
          to: delivery.expo_push_token,
          sound: 'default',
          title,
          body,
          data: data || {},
          priority: 'high',
          channelId: 'orders',
        });
      }

      if (messages.length === 0) {
        this.logger.warn('No hay tokens válidos para enviar notificaciones');
        return;
      }

      // Enviar en lotes
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          this.logger.log(`Enviadas ${ticketChunk.length} notificaciones a deliveries en ciudad ${cityId}`);
        } catch (error) {
          this.logger.error(`Error enviando chunk de notificaciones: ${error.message}`);
        }
      }

      // Verificar si hubo errores en los tickets
      tickets.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          this.logger.error(`Error en ticket ${index}: ${ticket.message}`);
          // Si el token es inválido, podríamos limpiarlo de la BD
          if (ticket.details?.error === 'DeviceNotRegistered') {
            // Aquí podrías limpiar el token del delivery
            this.logger.warn(`Token DeviceNotRegistered para delivery, considerar limpiarlo`);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error al notificar deliveries: ${error.message}`, error.stack);
    }
  }

  /**
   * Registra o actualiza el token de push de un usuario
   * @param userId ID del usuario
   * @param token Token de Expo Push
   */
  async registerPushToken(userId: number, token: string): Promise<void> {
    if (!Expo.isExpoPushToken(token)) {
      throw new Error('Token de push inválido');
    }

    await this.userRepository.update(
      { id_usuario: userId },
      { expo_push_token: token },
    );

    this.logger.log(`Token de push registrado para usuario ${userId}`);
  }

  /**
   * Limpia el token de push de un usuario (al cerrar sesión)
   * @param userId ID del usuario
   */
  async clearPushToken(userId: number): Promise<void> {
    await this.userRepository.update(
      { id_usuario: userId },
      { expo_push_token: null },
    );

    this.logger.log(`Token de push eliminado para usuario ${userId}`);
  }
}
