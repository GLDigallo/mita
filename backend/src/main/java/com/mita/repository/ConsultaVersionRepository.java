package com.mita.repository;

import com.mita.entity.ConsultaVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConsultaVersionRepository extends JpaRepository<ConsultaVersion, Long> {

    @Query("""
            select distinct cv from ConsultaVersion cv
            left join fetch cv.items
            left join fetch cv.cambios
            where cv.consulta.id = :consultaId
            """)
    List<ConsultaVersion> findHistorialCompleto(@Param("consultaId") Long consultaId);
}
