package com.agrandaditostienda.repository;

import com.agrandaditostienda.entity.VarianteProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface VarianteProductoRepository extends JpaRepository<VarianteProducto, Long> {

    List<VarianteProducto> findByProductoIdOrderByColorAscTalleAsc(Long productoId);

    List<VarianteProducto> findByProductoIdInAndActivoTrueOrderByColorAscTalleAsc(Collection<Long> productoIds);

    List<VarianteProducto> findByProductoIdIn(Collection<Long> productoIds);

    Optional<VarianteProducto> findByProductoIdAndColorAndTalle(Long productoId, String color, String talle);

    @Modifying(flushAutomatically = true)
    @Query("""
            update VarianteProducto v
            set v.stock = v.stock - :cantidad, v.actualizadaEn = :ahora
            where v.id = :id and v.stock >= :cantidad
            """)
    int descontarStock(@Param("id") Long id, @Param("cantidad") int cantidad, @Param("ahora") Instant ahora);

    @Modifying(flushAutomatically = true)
    @Query("""
            update VarianteProducto v
            set v.stock = v.stock + :cantidad, v.actualizadaEn = :ahora
            where v.id = :id
            """)
    int reponerStock(@Param("id") Long id, @Param("cantidad") int cantidad, @Param("ahora") Instant ahora);
}
