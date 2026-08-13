package com.agrandaditostienda.service;

import com.agrandaditostienda.dto.TiendaDTO;
import com.agrandaditostienda.entity.Tienda;
import com.agrandaditostienda.exception.RecursoNoEncontradoException;
import com.agrandaditostienda.mapper.TiendaMapper;
import com.agrandaditostienda.repository.TiendaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TiendaService {

    private final TiendaRepository tiendaRepository;
    private final TiendaMapper tiendaMapper;

    public TiendaService(TiendaRepository tiendaRepository, TiendaMapper tiendaMapper) {
        this.tiendaRepository = tiendaRepository;
        this.tiendaMapper = tiendaMapper;
    }

    @Transactional(readOnly = true)
    public List<TiendaDTO> listarTiendasActivas() {
        return tiendaRepository.findAllByActivaTrueOrderByOrdenAsc().stream()
                .map(tiendaMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public TiendaDTO obtenerTiendaPorSlug(String slug) {
        return tiendaMapper.toDTO(obtenerEntidadPorSlug(slug));
    }

    @Transactional(readOnly = true)
    public Tienda obtenerEntidadPorSlug(String slug) {
        return tiendaRepository.findBySlugAndActivaTrue(slug)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tienda no encontrada: " + slug));
    }
}
