package com.medfis.repository;

import com.medfis.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PacienteRepository extends JpaRepository<Paciente, UUID> {
    Optional<Paciente> findByTipoDocAndDocumento(String tipoDoc, String documento);
    boolean existsByTipoDocAndDocumento(String tipoDoc, String documento);
    List<Paciente> findAllByOrderByPrimerApellidoAscPrimerNombreAsc();

    @Query("""
        SELECT p FROM Paciente p WHERE
          LOWER(p.primerNombre) LIKE LOWER(CONCAT('%', :q, '%')) OR
          LOWER(COALESCE(p.segundoNombre,'')) LIKE LOWER(CONCAT('%', :q, '%')) OR
          LOWER(p.primerApellido) LIKE LOWER(CONCAT('%', :q, '%')) OR
          LOWER(COALESCE(p.segundoApellido,'')) LIKE LOWER(CONCAT('%', :q, '%')) OR
          p.documento LIKE CONCAT('%', :q, '%') OR
          LOWER(COALESCE(p.email,'')) LIKE LOWER(CONCAT('%', :q, '%')) OR
          COALESCE(p.celular,'') LIKE CONCAT('%', :q, '%') OR
          COALESCE(p.telefono,'') LIKE CONCAT('%', :q, '%')
        ORDER BY p.primerApellido, p.primerNombre
        """)
    List<Paciente> search(@Param("q") String q);
}