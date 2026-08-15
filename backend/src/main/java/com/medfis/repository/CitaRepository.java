package com.medfis.repository;

import com.medfis.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CitaRepository extends JpaRepository<Cita, UUID> {
    List<Cita> findByFechaOrderByHoraAsc(LocalDate fecha);
    List<Cita> findByPacienteIdOrderByFechaDescHoraDesc(UUID pacienteId);
}