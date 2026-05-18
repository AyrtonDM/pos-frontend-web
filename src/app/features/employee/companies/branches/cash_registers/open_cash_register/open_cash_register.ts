import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Navbar } from '../../../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-open-cash-register',
  imports: [FormsModule, Navbar, RouterLink, Sidebar],
  templateUrl: './open_cash_register.html',
  styleUrl: './open_cash_register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenCashRegister {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('idEmpresa') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected readonly cashRegisterId = this.route.snapshot.paramMap.get('cashRegisterId') ?? '';

  protected initialAmount: number | null = null;
  protected note = '';
}
