package com.agrandaditostienda.repository;

import com.agrandaditostienda.entity.Tienda;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TiendaRepository extends JpaRepository<Tienda, Long> {

    List<Tienda> findAllByActivaTrueOrderByOrdenAsc();

    Optional<Tienda> findBySlugAndActivaTrue(String slug);
}
