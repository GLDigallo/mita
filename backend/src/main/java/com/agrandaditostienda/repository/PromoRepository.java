package com.agrandaditostienda.repository;

import com.agrandaditostienda.entity.Promo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface PromoRepository extends JpaRepository<Promo, Long> {

    List<Promo> findAllByActivaTrue();

    List<Promo> findAllByActivaTrueAndFechaFinBefore(Instant fechaFin);
}