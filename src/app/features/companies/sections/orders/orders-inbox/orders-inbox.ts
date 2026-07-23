import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderService, Order } from '../../../../../core/services/order.service';

@Component({
  selector: 'app-orders-inbox',
  imports: [CommonModule],
  templateUrl: './orders-inbox.html',
  styleUrl: './orders-inbox.css',
  standalone: true
})
export class OrdersInbox implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  companyId!: number;
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  
  isLoading = true;
  errorMessage = '';

  selectedOrder: Order | null = null;
  isModalOpen = false;

  currentFilter = 'todos';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.companyId = parseInt(id, 10);
      this.loadOrders();
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getOrdersByCompany(this.companyId).subscribe({
      next: (data) => {
        // Sort by newest first
        this.orders = data.sort((a, b) => new Date(b.fecha_pedido).getTime() - new Date(a.fecha_pedido).getTime());
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar pedidos';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.currentFilter === 'todos') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(o => o.estado === this.currentFilter);
    }
  }

  viewDetails(order: Order): void {
    this.selectedOrder = order;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedOrder = null;
  }

  changeStatus(orderId: number, status: string): void {
    this.orderService.updateOrderStatus(this.companyId, orderId, status).subscribe({
      next: (updatedOrder) => {
        const index = this.orders.findIndex(o => o.id_pedido === orderId);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
          this.applyFilter();
        }
        if (this.selectedOrder?.id_pedido === orderId) {
            this.selectedOrder = updatedOrder;
        }
      },
      error: (err) => {
        console.error('Error actualizando estado', err);
        alert('Error al actualizar el estado del pedido');
      }
    });
  }
}
