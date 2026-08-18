package com.agrandaditostienda.repository;

import com.agrandaditostienda.entity.Genero;
import com.agrandaditostienda.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByTiendaIdAndActivoTrueOrderByCreadoEnDesc(Long tiendaId);

    List<Producto> findByTiendaIdAndGeneroInAndActivoTrueOrderByCreadoEnDesc(Long tiendaId, List<Genero> generos);

    List<Producto> findByTiendaIdAndCategoriaIdAndActivoTrueOrderByCreadoEnDesc(Long tiendaId, Long categoriaId);

    List<Producto> findByTiendaIdAndCategoriaIdAndGeneroInAndActivoTrueOrderByCreadoEnDesc(
            Long tiendaId, Long categoriaId, List<Genero> generos);

    List<Producto> findByDestacadoTrueAndActivoTrueOrderByCreadoEnDesc();

    List<Producto> findTop10ByActivoTrueOrderByCreadoEnDesc();

    @Query("select distinct p.genero from Producto p where p.tienda.id = :tiendaId and p.activo = true order by p.genero")
    List<Genero> findGenerosByTiendaId(@Param("tiendaId") Long tiendaId);

    long countByCategoriaIdAndActivoTrue(Long categoriaId);

    long countByCategoriaId(Long categoriaId);

    @Modifying
    @Query("update Producto p set p.categoria = null where p.categoria.id = :categoriaId and p.activo = false")
    int desasociarInactivosDeCategoria(@Param("categoriaId") Long categoriaId);
}
