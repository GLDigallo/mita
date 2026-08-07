package com.mita.repository;

import com.mita.entity.Genero;
import com.mita.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByTiendaIdAndActivoTrueOrderByDestacadoDesc(Long tiendaId);

    List<Producto> findByTiendaIdAndGeneroInAndActivoTrueOrderByDestacadoDesc(Long tiendaId, List<Genero> generos);

    List<Producto> findByTiendaIdAndCategoriaIdAndActivoTrueOrderByDestacadoDesc(Long tiendaId, Long categoriaId);

    List<Producto> findByTiendaIdAndCategoriaIdAndGeneroInAndActivoTrueOrderByDestacadoDesc(
            Long tiendaId, Long categoriaId, List<Genero> generos);

    List<Producto> findByDestacadoTrueAndActivoTrue();

    @Query("select distinct p.genero from Producto p where p.tienda.id = :tiendaId and p.activo = true order by p.genero")
    List<Genero> findGenerosByTiendaId(@Param("tiendaId") Long tiendaId);
}
