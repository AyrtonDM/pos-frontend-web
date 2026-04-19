import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Navbar } from '../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../shared/components/sidebar/sidebar';

type Product = {
  nombre: string;
  codigo: string;
  precio: string;
  stock: number;
  activo: boolean;
};

@Component({
  selector: 'app-products',
  imports: [Navbar, Sidebar],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Sucursales',
      link: ['/administrator/company', this.companyId, 'branches'],
    },
    {
      label: 'Productos',
      link: ['/administrator/company', this.companyId, 'products'],
      active: true,
    },
  ];

  protected readonly products: Product[] = [
    {
      nombre: 'Cafe premium',
      codigo: 'PROD-001',
      precio: 'Bs 58',
      stock: 24,
      activo: true,
    },
    {
      nombre: 'Pan artesanal',
      codigo: 'PROD-002',
      precio: 'Bs 24',
      stock: 40,
      activo: true,
    },
    {
      nombre: 'Pack familiar',
      codigo: 'PROD-003',
      precio: 'Bs 166.50',
      stock: 8,
      activo: false,
    },
  ];
}
