package com.agrandaditostienda.repository;

import com.agrandaditostienda.entity.RolUsuario;
import com.agrandaditostienda.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    @Query("select u from Usuario u left join fetch u.tienda where u.username = :username")
    Optional<Usuario> findByUsernameConTienda(String username);

    boolean existsByUsername(String username);

    boolean existsByRolAndTiendaId(RolUsuario rol, Long tiendaId);
}
