package com.medfis.service;

import com.medfis.dto.CitaResponse;
import com.medfis.entity.Cita;
import com.medfis.entity.Paciente;
import com.medfis.repository.CitaRepository;
import com.medfis.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CitaService {

    private final CitaRepository citaRepo;
    private final PacienteRepository pacienteRepo;

    private static final List<String> ESTADOS_OK = List.of(
            "PROGRAMADA", "CONFIRMADA", "CUMPLIDA", "CANCELADA", "NO_ASISTIO"
    );

    private CitaResponse toResponse(Cita c) {
        Paciente p = pacienteRepo.findById(c.getPacienteId()).orElse(null);
        String nombre = p == null ? "—" : Stream.of(
                        p.getPrimerNombre(), p.getSegundoNombre(),
                        p.getPrimerApellido(), p.getSegundoApellido()
                )
                .filter(x -> x != null && !x.isBlank())
                .collect(Collectors.joining(" "));

        String tel = null;
        if (p != null) {
            tel = p.getCelular() != null && !p.getCelular().isBlank()
                    ? p.getCelular()
                    : p.getTelefono();
        }

        return new CitaResponse(
                c.getId(),
                c.getPacienteId(),
                nombre,
                p != null ? p.getTipoDoc() : null,
                p != null ? p.getDocumento() : null,
                tel,
                p != null ? p.getEmail() : null,
                c.getFecha() != null ? c.getFecha().toString() : null,
                c.getHora() != null ? c.getHora().toString() : null,
                c.getTipoCita(),
                c.getTratamiento(),
                c.getDescripcion(),
                c.getObservaciones(),
                c.getEstado(),
                c.getProfesional(),
                c.getCreadoPor(),
                c.getActualizadoPor(),
                c.getObservacionEstado()
        );
    }

    public List<CitaResponse> listarPorFecha(LocalDate fecha) {
        return citaRepo.findByFechaOrderByHoraAsc(fecha).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<CitaResponse> listarPorPaciente(UUID pacienteId) {
        pacienteRepo.findById(pacienteId)
                .orElseThrow(() -> new RuntimeException("Paciente no encontrado"));
        return citaRepo.findByPacienteIdOrderByFechaDescHoraDesc(pacienteId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CitaResponse crear(Cita body, Authentication auth) {
        pacienteRepo.findById(body.getPacienteId())
                .orElseThrow(() -> new RuntimeException("Paciente no encontrado"));

        if (body.getFecha() == null || body.getHora() == null)
            throw new RuntimeException("Fecha y hora son obligatorias");
        if (body.getTipoCita() == null || body.getTipoCita().isBlank())
            throw new RuntimeException("Tipo de cita obligatorio");
        if (body.getTratamiento() == null || body.getTratamiento().isBlank())
            throw new RuntimeException("Tratamiento obligatorio");
        if (body.getDescripcion() == null || body.getDescripcion().isBlank())
            throw new RuntimeException("Descripción obligatoria");

        if (body.getEstado() == null || body.getEstado().isBlank())
            body.setEstado("PROGRAMADA");
        if (auth != null)
            body.setCreadoPor(auth.getName());

        return toResponse(citaRepo.save(body));
    }

    /**
     * Cambia estado + guarda quién lo hizo y observación (cancelación, etc.)
     */
    @Transactional
    public CitaResponse cambiarEstado(
            UUID id,
            String estado,
            String observacion,
            Authentication auth
    ) {
        Cita c = citaRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        String e = estado == null ? "" : estado.trim().toUpperCase();
        if (!ESTADOS_OK.contains(e))
            throw new RuntimeException("Estado no válido: " + estado);

        c.setEstado(e);
        if (observacion != null && !observacion.isBlank())
            c.setObservacionEstado(observacion.trim());
        if (auth != null)
            c.setActualizadoPor(auth.getName());

        return toResponse(citaRepo.save(c));
    }

    /** Compatibilidad con nombre anterior */
    @Transactional
    public CitaResponse actualizarEstado(UUID id, String estado) {
        return cambiarEstado(id, estado, null, null);
    }
}