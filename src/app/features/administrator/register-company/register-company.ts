import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-register-company',
  imports: [Navbar, RouterLink],
  templateUrl: './register-company.html',
  styleUrl: './register-company.css',
})
export class RegisterCompany {}
