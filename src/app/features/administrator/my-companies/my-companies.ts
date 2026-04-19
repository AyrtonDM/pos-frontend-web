import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Company, CompanyService } from '../../../core/services/company.service';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-my-companies',
  imports: [Navbar, RouterLink],
  templateUrl: './my-companies.html',
  styleUrl: './my-companies.css',
})
export class MyCompanies implements OnInit {
  protected companies: Company[] = [];
  protected cargandoEmpresas = false;
  protected errorEmpresas = '';

  constructor(
    private readonly companyService: CompanyService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarMisEmpresas();
  }

  protected obtenerIdEmpresa(company: Company): string | number {
    return (
      company.idEmpresa ?? company.id_empresa ?? company.empresa_id ?? company.id ?? company.nit
    );
  }

  private cargarMisEmpresas(): void {
    this.cargandoEmpresas = true;
    this.errorEmpresas = '';

    this.companyService.getMisEmpresas().subscribe({
      next: (companies) => {
        this.companies = companies;
        this.cargandoEmpresas = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.companies = [];
        this.cargandoEmpresas = false;
        this.errorEmpresas = 'No se pudieron cargar tus empresas. Intenta nuevamente.';
        this.cdr.detectChanges();
      },
    });
  }
}
