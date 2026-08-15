package com.medfis.service;

import com.medfis.entity.HistoriaClinica;
import com.medfis.entity.Usuario;
import com.medfis.repository.HistoriaClinicaRepository;
import com.medfis.repository.PacienteRepository;
import com.medfis.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HistoriaClinicaService {

    private final HistoriaClinicaRepository historiaRepo;
    private final PacienteRepository pacienteRepo;
    private final UsuarioRepository usuarioRepo;

    /**
     * Solo ADMINISTRADOR, MEDICO o usuarios con puedeEditarHc = true
     * pueden crear/editar historia clínica.
     */
    private void assertPuedeEditarHc(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("No autenticado");
        }

        Usuario u = usuarioRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        boolean ok = u.getRol() == Usuario.RolUsuario.ADMINISTRADOR
                || u.getRol() == Usuario.RolUsuario.MEDICO
                || u.isPuedeEditarHc();

        if (!ok) {
            throw new RuntimeException(
                    "No tiene permiso para modificar historia clínica. " +
                            "Solo Administrador, Médico o personal autorizado."
            );
        }
    }

    private Usuario usuarioActual(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("No autenticado");
        }
        return usuarioRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    /** Ver historial: cualquier staff autenticado (el controller exige login). */
    public List<HistoriaClinica> listarPorPaciente(UUID pacienteId) {
        pacienteRepo.findById(pacienteId)
                .orElseThrow(() -> new RuntimeException("Paciente no encontrado"));
        return historiaRepo.findByPacienteIdOrderByFechaDescCreatedAtDesc(pacienteId);
    }

    public HistoriaClinica buscarPorId(UUID id) {
        return historiaRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota de historia clínica no encontrada"));
    }

    /** Nueva nota: solo con permiso de edición. */
    @Transactional
    public HistoriaClinica crear(HistoriaClinica nota, Authentication auth) {
        assertPuedeEditarHc(auth);

        if (nota.getPacienteId() == null) {
            throw new RuntimeException("pacienteId es obligatorio");
        }

        pacienteRepo.findById(nota.getPacienteId())
                .orElseThrow(() -> new RuntimeException("Paciente no encontrado"));

        Usuario u = usuarioActual(auth);
        nota.setId(null);
        nota.setCreadoPor(u.getNombre());
        nota.setCreadoPorRol(u.getRol().name());
        nota.setActualizadoPor(null);

        return historiaRepo.save(nota);
    }

    /** Actualizar nota: solo con permiso de edición. */
    @Transactional
    public HistoriaClinica actualizar(UUID id, HistoriaClinica datos, Authentication auth) {
        assertPuedeEditarHc(auth);

        HistoriaClinica h = historiaRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota no encontrada"));

        if (datos.getFecha() != null) {
            h.setFecha(datos.getFecha());
        }
        h.setMotivoConsulta(datos.getMotivoConsulta());
        h.setEnfermedadActual(datos.getEnfermedadActual());

        h.setTension(datos.getTension());
        h.setFrecuenciaCardiaca(datos.getFrecuenciaCardiaca());
        h.setFrecuenciaRespiratoria(datos.getFrecuenciaRespiratoria());
        h.setTemperatura(datos.getTemperatura());
        h.setOximetria(datos.getOximetria());
        h.setPeso(datos.getPeso());
        h.setTalla(datos.getTalla());
        h.setImc(datos.getImc());

        h.setExamenFisico(datos.getExamenFisico());
        h.setDiagnostico(datos.getDiagnostico());
        h.setPlanManejo(datos.getPlanManejo());
        h.setObservaciones(datos.getObservaciones());

        if (datos.getConsentimientoId() != null) {
            h.setConsentimientoId(datos.getConsentimientoId());
        }

        Usuario u = usuarioActual(auth);
        h.setActualizadoPor(u.getNombre());

        return historiaRepo.save(h);
    }
}