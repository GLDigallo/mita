package com.agrandaditostienda.repository;

import com.agrandaditostienda.entity.EstadoVenta;
import com.agrandaditostienda.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VentaRepository extends JpaRepository<Venta, Long> {

    @Query("""
            select distinct v from Venta v
            left join fetch v.cliente
            left join fetch v.tienda
            left join fetch v.consulta
            left join fetch v.items vi
            left join fetch vi.producto
            left join fetch vi.variante
            where v.id = :id
            """)
    Optional<Venta> findDetalle(@Param("id") Long id);

    Optional<Venta> findByConsultaId(Long consultaId);

    boolean existsByConsultaId(Long consultaId);

    @Query("""
            select v from Venta v
            left join fetch v.cliente
            left join fetch v.tienda
            left join fetch v.consulta
            where (:estado is null or v.estado = :estado)
              and (:tiendaId is null or v.tienda.id = :tiendaId)
              and (:termino is null or :termino = ''
                    or cast(v.numero as string) like :termino
                    or lower(coalesce(v.cliente.nombre, '')) like :termino
                    or v.cliente.telefono like :termino)
            order by v.fechaVenta desc nulls last, v.id desc
            """)
    List<Venta> buscar(@Param("estado") EstadoVenta estado,
                       @Param("tiendaId") Long tiendaId,
                       @Param("termino") String termino);

    @Query("""
            select vi.venta.id, sum(vi.cantidad)
            from VentaItem vi
            where vi.venta.id in :ids
            group by vi.venta.id
            """)
    List<Object[]> contarItems(@Param("ids") List<Long> ids);

    @Query(value = "select nextval('venta_numero_seq')", nativeQuery = true)
    Long siguienteNumero();
}
