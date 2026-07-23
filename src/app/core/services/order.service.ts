import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface OrderDetail {
  id_detalle_pedido: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio_unitario_estimado: string;
  descuento_estimado: string;
  subtotal_estimado: string;
  producto?: any; // To hold product details if expanded
}

export interface Order {
  id_pedido: number;
  id_empresa: number;
  id_sucursal: number;
  id_cliente: number;
  fecha_pedido: string;
  estado: string; // 'enviado', 'en_revision', 'confirmado', 'en_preparacion', 'listo_para_recoger', 'convertido_en_venta', 'cancelado', 'rechazado'
  observacion_cliente?: string;
  detalles: OrderDetail[];
  cliente?: any; // Customer info
  sucursal?: any; // Branch info
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private api = inject(ApiService);

  getOrdersByCompany(companyId: number): Observable<Order[]> {
    return this.api.get<Order[]>(`/api/pedidos/empresas/${companyId}`);
  }

  updateOrderStatus(companyId: number, orderId: number, status: string): Observable<Order> {
    return this.api.patch<Order>(`/api/pedidos/empresas/${companyId}/${orderId}/estado`, { nuevo_estado: status });
  }
}
