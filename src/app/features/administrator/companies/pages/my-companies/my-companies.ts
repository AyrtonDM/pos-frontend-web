import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../../../../shared/components/navbar/navbar';

type Company = {
  nombre: string;
  razon_social: string;
  nit: string;
  correo: string;
  fecha_registro: string;
  activo: boolean;
};

@Component({
  selector: 'app-my-companies',
  imports: [Navbar, RouterLink],
  templateUrl: './my-companies.html',
  styleUrl: './my-companies.css',
})
export class MyCompanies {
  protected readonly companies: Company[] = [
    {
      nombre: 'Mercado Central POS',
      razon_social: 'Mercado Central SRL',
      nit: '1023456789',
      correo: 'contacto@mercadocentral.com',
      fecha_registro: '2026-04-10',
      activo: true,
    },
    {
      nombre: 'Cafe Norte',
      razon_social: 'Cafe Norte Bolivia SA',
      nit: '2045678912',
      correo: 'admin@cafenorte.com',
      fecha_registro: '2026-04-14',
      activo: true,
    },
    {
      nombre: 'Tienda Express',
      razon_social: 'Tienda Express SRL',
      nit: '3098765412',
      correo: 'ventas@tiendaexpress.com',
      fecha_registro: '2026-04-17',
      activo: false,
    },
  ];
}
