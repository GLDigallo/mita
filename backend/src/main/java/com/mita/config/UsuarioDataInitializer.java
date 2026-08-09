package com.mita.config;

import com.mita.entity.RolUsuario;
import com.mita.entity.Tienda;
import com.mita.entity.Usuario;
import com.mita.repository.TiendaRepository;
import com.mita.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UsuarioDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(UsuarioDataInitializer.class);

    private final UsuarioRepository usuarioRepository;
    private final TiendaRepository tiendaRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${mita.admin.username}")
    private String adminUsername;

    @Value("${mita.admin.password}")
    private String adminPassword;

    @Value("${mita.encargada.password:encargada123}")
    private String encargadaPassword;

    public UsuarioDataInitializer(UsuarioRepository usuarioRepository,
                                  TiendaRepository tiendaRepository,
                                  PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.tiendaRepository = tiendaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        crearDueño();
        crearEncargadasDeEjemplo();
    }

    private void crearDueño() {
        if (usuarioRepository.existsByUsername(adminUsername)) {
            return;
        }
        usuarioRepository.save(new Usuario(
                "Dueño",
                adminUsername,
                passwordEncoder.encode(adminPassword),
                RolUsuario.DUENO,
                null));
        log.info("Usuario dueño '{}' creado", adminUsername);
    }

    private void crearEncargadasDeEjemplo() {
        List<Tienda> tiendas = tiendaRepository.findAll();
        for (Tienda tienda : tiendas) {
            String username = "encargada-" + tienda.getSlug();
            if (usuarioRepository.existsByUsername(username)) {
                continue;
            }
            if (usuarioRepository.existsByRolAndTiendaId(RolUsuario.ENCARGADA, tienda.getId())) {
                continue;
            }
            usuarioRepository.save(new Usuario(
                    "Encargada " + tienda.getNombre(),
                    username,
                    passwordEncoder.encode(encargadaPassword),
                    RolUsuario.ENCARGADA,
                    tienda));
            log.info("Encargada de ejemplo '{}' creada para {}", username, tienda.getNombre());
        }
    }
}
