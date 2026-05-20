import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Navbar } from '../../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../../shared/components/sidebar/sidebar';

type ClientCategoryTab = 'register' | 'list';

interface ClientCategoryForm {
  nombre: string;
  descripcion: string;
  permitCredito: boolean;
  descuentoBase: number;
  limiteCredito: number;
  activo: boolean;
}

interface ClientCategory {
  id: number;
  nombre: string;
  descripcion: string;
  permitCredito: boolean;
  descuentoBase: number;
  limiteCredito: number;
  activo: boolean;
}

@Component({
  selector: 'app-categorias-clientes',
  imports: [FormsModule, DecimalPipe, Navbar, Sidebar],
  templateUrl: './my-categories.html',
  styleUrl: './my-categories.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriasClientes {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected companyName = 'Empresa';
  protected activeTab: ClientCategoryTab = 'list';

  protected readonly categoryForm: ClientCategoryForm = {
    nombre: '',
    descripcion: '',
    permitCredito: false,
    descuentoBase: 0,
    limiteCredito: 0,
    activo: true,
  };

  protected categories: ClientCategory[] = [
    {
      id: 1,
      nombre: 'Mayoristas',
      descripcion: 'Clientes con compras frecuentes o por volumen.',
      permitCredito: true,
      descuentoBase: 15,
      limiteCredito: 5000,
      activo: true,
    },
    {
      id: 2,
      nombre: 'Minoristas',
      descripcion: 'Clientes regulares de atención general.',
      permitCredito: true,
      descuentoBase: 5,
      limiteCredito: 1000,
      activo: true,
    },
  ];

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Sucursales',
      link: ['/administrator/company', this.companyId, 'branches'],
    },
    {
      label: 'Productos',
      link: ['/administrator/company', this.companyId, 'products'],
    },
    {
      label: 'Clientes',
      active: true,
      expanded: true,
      children: [
        {
          label: 'Catalogo',
          link: ['/administrator/company', this.companyId, 'clients'],
        },
        {
          label: 'Categorias',
          link: ['/administrator/company', this.companyId, 'clients', 'categories'],
          active: true,
        },
      ],
    },
  ];

  protected setActiveTab(tab: ClientCategoryTab): void {
    this.activeTab = tab;
  }

  protected registrarCategoria(event: SubmitEvent): void {
    event.preventDefault();

    const nombre = this.categoryForm.nombre.trim();
    if (!nombre) {
      return;
    }

    this.categories = [
      {
        id: Date.now(),
        nombre,
        descripcion: this.categoryForm.descripcion.trim(),
        permitCredito: this.categoryForm.permitCredito,
        descuentoBase: this.categoryForm.descuentoBase,
        limiteCredito: this.categoryForm.limiteCredito,
        activo: this.categoryForm.activo,
      },
      ...this.categories,
    ];

    this.categoryForm.nombre = '';
    this.categoryForm.descripcion = '';
    this.categoryForm.permitCredito = false;
    this.categoryForm.descuentoBase = 0;
    this.categoryForm.limiteCredito = 0;
    this.categoryForm.activo = true;
    this.activeTab = 'list';
  }
}
