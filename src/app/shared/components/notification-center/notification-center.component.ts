import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import axios from 'axios';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.css']
})
export class NotificationCenterComponent implements OnInit {
  items: any[] = [];
  apiBase = 'http://127.0.0.1:8000';
  selected: any = null;
  @Output() unreadCountChange = new EventEmitter<number>();

  constructor() {}

  async ngOnInit() {
    await this.load();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (ev: any) => {
        if (ev.data?.type === 'NOTIFICATION_CLICK') {
          this.handleIncoming(ev.data.payload);
        }
      });
    }
  }

  async load() {
    const res = await axios.get(`${this.apiBase}/notifications/history/empresas/1`);
    this.items = (res.data.items || [])
      .map((it: any) => this.normalizeNotification(it))
      .sort((left: any, right: any) => right.sortAt.getTime() - left.sortAt.getTime());
    this.emitUnreadCount();
  }

  async markRead(item: any) {
    await axios.post(`${this.apiBase}/notifications/mark-read`, { id: item.id });
    item.leido = true;
    this.emitUnreadCount();
  }

  handleIncoming(payload: any) {
    this.items.unshift(this.normalizeNotification({
      titulo: payload.title || 'Notificación',
      mensaje: payload.body || '',
      fecha: new Date().toISOString(),
      leido: false,
      payload,
    }));
    this.items.sort((left: any, right: any) => right.sortAt.getTime() - left.sortAt.getTime());
    this.emitUnreadCount();
  }

  openDetail(item: any) {
    // mark read locally and on server
    const payload = item.payload || {};
    const sucursal_nombre = payload.sucursal_nombre || payload.nombre_sucursal || payload.sucursal || payload.sucursal?.nombre || payload.sucursal?.nombre_sucursal || payload.branch_name || null;
    const producto_nombre = payload.producto_nombre || payload.nombre_producto || payload.producto || payload.producto?.nombre || payload.product?.nombre || payload.product_name || null;
    const cantidad = payload.cantidad ?? payload.stock_actual ?? payload.cantidad_actual ?? payload.qty ?? payload.quantity ?? null;

    this.selected = { ...item, display: { sucursal_nombre, producto_nombre, cantidad }, payload };
    if (!item.leido) this.markRead(item).catch(() => {});
  }

  closeDetail() {
    this.selected = null;
  }

  private emitUnreadCount() {
    this.unreadCountChange.emit(this.items.filter((item) => !item.leido).length);
  }

  private normalizeNotification(item: any) {
    const payload = (typeof item.payload === 'string' ? tryParseJson(item.payload) : item.payload) || {};
    const sucursal_nombre = payload.sucursal_nombre || payload.nombre_sucursal || payload.sucursal || payload.sucursal?.nombre || payload.sucursal?.nombre_sucursal || payload.branch_name || null;
    const producto_nombre = payload.producto_nombre || payload.nombre_producto || payload.producto || payload.producto?.nombre || payload.product?.nombre || payload.product_name || null;
    const cantidad = payload.cantidad ?? payload.stock_actual ?? payload.cantidad_actual ?? payload.qty ?? payload.quantity ?? null;
    const titulo = item.titulo || payload.title || (sucursal_nombre ? `Stock bajo en "${sucursal_nombre}"` : 'Notificación');

    return {
      id: item.id,
      titulo,
      mensaje: item.mensaje || payload.body || payload.message || '',
      fecha: item.fecha || item.created_at || item.createdAt || new Date().toISOString(),
      fechaLegible: formatDateTime(item.fecha || item.created_at || item.createdAt || new Date().toISOString()),
      sortAt: new Date(item.fecha || item.created_at || item.createdAt || new Date().toISOString()),
      leido: !!item.leido,
      payload,
      display: { sucursal_nombre, producto_nombre, cantidad },
    };
  }
}

function tryParseJson(value: any) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formatDateTime(value: string | Date): string {
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    // If the server sent a naive ISO timestamp without timezone (e.g. "2024-05-18T12:34:56"),
    // treat it as UTC by appending a 'Z' so the Date constructor does not parse it as local.
    const isoNoTZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
    const normalized = isoNoTZ.test(value) ? `${value}Z` : value;
    date = new Date(normalized);
  } else {
    date = new Date(String(value));
  }

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
