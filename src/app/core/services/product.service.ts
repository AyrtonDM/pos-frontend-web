import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface CategoriaProducto {
  id_categoria_producto: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

export interface SubcategoriaProducto {
  id_subcategoria: number;
  id_categoria_producto: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

export interface StockProducto {
  id_stock: number;
  cantidad: number;
  stock_min: number;
  stock_max: number;
  fecha_actualizacion: string;
}

export interface Producto {
  id_producto: number;
  id_empresa: number;
  id_subcategoria: number;
  nombre: string;
  costo: number;
  precio: number;
  imagen?: string | null;
  subcategoria: SubcategoriaProducto;
  stock: StockProducto;
}

export interface CrearCategoriaRequest {
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface CrearSubcategoriaRequest {
  id_categoria_producto: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface CrearProductoRequest {
  id_empresa: number;
  id_subcategoria: number;
  nombre: string;
  costo: number;
  precio: number;
  stock: {
    cantidad: number;
    stock_min: number;
    stock_max: number;
  };
}

export interface ActualizarCategoriaRequest {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface ActualizarSubcategoriaRequest {
  id_categoria_producto?: number;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface ActualizarProductoRequest {
  id_empresa?: number;
  id_subcategoria?: number;
  nombre?: string;
  costo?: number;
  precio?: number;
  stock?: {
    cantidad?: number;
    stock_min?: number;
    stock_max?: number;
  };
}

export interface ActualizarStockRequest {
  cantidad?: number;
  stock_min?: number;
  stock_max?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private readonly apiService: ApiService) {}

  getCategorias(): Observable<CategoriaProducto[]> {
    return this.apiService.get<CategoriaProducto[]>('/api/productos/categorias');
  }

  crearCategoria(payload: CrearCategoriaRequest): Observable<CategoriaProducto> {
    return this.apiService.post<CategoriaProducto, CrearCategoriaRequest>(
      '/api/productos/categorias',
      payload,
    );
  }

  obtenerCategoria(idCategoriaProducto: number): Observable<CategoriaProducto> {
    return this.apiService.get<CategoriaProducto>(`/api/productos/categorias/${idCategoriaProducto}`);
  }

  actualizarCategoria(
    idCategoriaProducto: number,
    payload: ActualizarCategoriaRequest,
  ): Observable<CategoriaProducto> {
    return this.apiService.put<CategoriaProducto, ActualizarCategoriaRequest>(
      `/api/productos/categorias/${idCategoriaProducto}`,
      payload,
    );
  }

  eliminarCategoria(idCategoriaProducto: number): Observable<{ mensaje: string }> {
    return this.apiService.delete<{ mensaje: string }>(`/api/productos/categorias/${idCategoriaProducto}`);
  }

  getSubcategorias(): Observable<SubcategoriaProducto[]> {
    return this.apiService.get<SubcategoriaProducto[]>('/api/productos/subcategorias');
  }

  crearSubcategoria(payload: CrearSubcategoriaRequest): Observable<SubcategoriaProducto> {
    return this.apiService.post<SubcategoriaProducto, CrearSubcategoriaRequest>(
      '/api/productos/subcategorias',
      payload,
    );
  }

  obtenerSubcategoria(idSubcategoria: number): Observable<SubcategoriaProducto> {
    return this.apiService.get<SubcategoriaProducto>(`/api/productos/subcategorias/${idSubcategoria}`);
  }

  actualizarSubcategoria(
    idSubcategoria: number,
    payload: ActualizarSubcategoriaRequest,
  ): Observable<SubcategoriaProducto> {
    return this.apiService.put<SubcategoriaProducto, ActualizarSubcategoriaRequest>(
      `/api/productos/subcategorias/${idSubcategoria}`,
      payload,
    );
  }

  getProductosPorEmpresa(idEmpresa: number): Observable<Producto[]> {
    return this.apiService.get<Producto[]>(`/api/productos?id_empresa=${idEmpresa}`);
  }

  crearProducto(payload: CrearProductoRequest): Observable<Producto> {
    return this.apiService.post<Producto, CrearProductoRequest>('/api/productos', payload);
  }

  obtenerProducto(idProducto: number): Observable<Producto> {
    return this.apiService.get<Producto>(`/api/productos/${idProducto}`);
  }

  actualizarProducto(idProducto: number, payload: ActualizarProductoRequest): Observable<Producto> {
    return this.apiService.put<Producto, ActualizarProductoRequest>(
      `/api/productos/${idProducto}`,
      payload,
    );
  }

  eliminarProducto(idProducto: number): Observable<{ mensaje: string }> {
    return this.apiService.delete<{ mensaje: string }>(`/api/productos/${idProducto}`);
  }

  actualizarImagenProducto(idProducto: number, imagen: File): Observable<Producto> {
    const formData = new FormData();
    formData.append('imagen', imagen);
    return this.apiService.put<Producto, FormData>(`/api/productos/${idProducto}/imagen`, formData);
  }

  crearProductoConImagen(formData: FormData): Observable<Producto> {
    return this.apiService.post<Producto, FormData>('/api/productos/con-imagen', formData);
  }

  actualizarStock(idProducto: number, payload: ActualizarStockRequest): Observable<StockProducto> {
    return this.apiService.put<StockProducto, ActualizarStockRequest>(
      `/api/productos/${idProducto}/stock`,
      payload,
    );
  }

  getStockProducto(idProducto: number): Observable<StockProducto> {
    return this.apiService.get<StockProducto>(`/api/productos/${idProducto}/stock`);
  }

  getMovimientosProducto(idProducto: number): Observable<any[]> {
    return this.apiService.get<any[]>(`/api/productos/${idProducto}/movimientos`);
  }

  crearMovimientoProducto(idProducto: number, payload: { cantidad: number; observacion?: string; id_tipo_movimiento: number }): Observable<any> {
    return this.apiService.post<any, typeof payload>(`/api/productos/${idProducto}/movimientos`, payload);
  }

  getResumenInventario(): Observable<any> {
    return this.apiService.get<any>('/api/inventario/estado');
  }
}