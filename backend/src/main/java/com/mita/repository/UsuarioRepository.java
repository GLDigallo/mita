package com.mita.repository;

import com.mita.entity.RolUsuario;
import com.mita.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    @Query("select u from Usuario u left join fetch u.tienda where u.username = :username")
    Optional<Usuario> findByUsernameConTienda(String username);

    @Query("select u from Usuario u left join fetch u.tienda order by u.nombre asc")
    List<Usuario> findAllConTienda();

    boolean existsByUsername(String username);

    boolean existsByRolAndTiendaId(RolUsuario rol, Long tiendaId);
}
