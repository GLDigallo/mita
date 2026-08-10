package com.mita.repository;

import com.mita.entity.Consulta;
import com.mita.entity.EstadoConsulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {

    @Query("""
            select distinct c from Consulta c
            left join fetch c.cliente
            left join fetch c.tienda
            left join fetch c.productosConsultados pc
            left join fetch pc.producto
            where c.id = :id
            """)
    Optional<Consulta> findDetalle(@Param("id") Long id);

    @Query("""
            select c from Consulta c
            left join fetch c.cliente
            left join fetch c.tienda
            where (:estado is null or c.estado = :estado)
              and (:tiendaId is null or c.tienda.id = :tiendaId)
              and (:termino is null or :termino = ''
                    or cast(c.numero as string) like :termino
                    or lower(coalesce(c.cliente.nombre, '')) like :termino
                    or c.cliente.telefono like :termino)
            order by c.fechaConsulta desc
            """)
    List<Consulta> buscar(@Param("estado") EstadoConsulta estado,
                          @Param("tiendaId") Long tiendaId,
                          @Param("termino") String termino);

    @Query("""
            select pc.consulta.id, sum(pc.cantidad)
            from ProductoConsultado pc
            where pc.consulta.id in :ids
            group by pc.consulta.id
            """)
    List<Object[]> contarItems(@Param("ids") List<Long> ids);

    @Query(value = "select nextval('consulta_numero_seq')", nativeQuery = true)
    Long siguienteNumero();
}
