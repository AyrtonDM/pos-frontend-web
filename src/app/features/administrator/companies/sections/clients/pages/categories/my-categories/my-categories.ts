import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Navbar } from '../../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../../shared/components/sidebar/sidebar';

type ClientCategoryTab = 'register' | 'list';

interface ClientCategoryForm {
  nombre: string;
  descripcion: string;
}

interface ClientCategory {
  id: number;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-categorias-clientes',
  imports: [FormsModule, Navbar, Sidebar],
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
  };

  protected categories: ClientCategory[] = [
    {
      id: 1,
      nombre: 'Mayoristas',
      descripcion: 'Clientes con compras frecuentes o por volumen.',
    },
    {
      id: 2,
      nombre: 'Minoristas',
      descripcion: 'Clientes regulares de atencion general.',
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
      },
      ...this.categories,
    ];

    this.categoryForm.nombre = '';
    this.categoryForm.descripcion = '';
    this.activeTab = 'list';
  }
}