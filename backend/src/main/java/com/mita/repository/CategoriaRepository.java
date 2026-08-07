package com.mita.repository;

import com.mita.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findByTiendaIdOrderByOrdenAsc(Long tiendaId);

    Optional<Categoria> findByTiendaIdAndSlug(Long tiendaId, String slug);
}
