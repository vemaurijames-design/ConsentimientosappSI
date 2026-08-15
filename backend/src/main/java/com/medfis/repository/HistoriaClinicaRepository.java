package com.medfis.repository;

import com.medfis.entity.HistoriaClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, UUID> {
    List<HistoriaClinica> findByPacienteIdOrderByFechaDescCreatedAtDesc(UUID pacienteId);
}