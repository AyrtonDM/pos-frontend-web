import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-edit-company',
  imports: [Navbar, RouterLink],
  templateUrl: './edit-company.html',
  styleUrl: './edit-company.css',
})
export class EditCompany {}
