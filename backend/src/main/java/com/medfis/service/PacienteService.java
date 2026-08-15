package com.medfis.service;

import com.medfis.dto.PacienteBasicoDTO;
import com.medfis.entity.Paciente;
import com.medfis.entity.Usuario;
import com.medfis.repository.PacienteRepository;
import com.medfis.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PacienteService {

    private final PacienteRepository pacienteRepo;
    private final UsuarioRepository usuarioRepo;

    private void assertAdminOMedico(Authentication auth) {
        if (auth == null || auth.getName() == null)
            throw new RuntimeException("No autenticado");
        Usuario u = usuarioRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        boolean ok = u.getRol() == Usuario.RolUsuario.ADMINISTRADOR
                || u.getRol() == Usuario.RolUsuario.MEDICO;
        if (!ok)
            throw new RuntimeException("Solo Administrador o Médico pueden modificar pacientes");
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    /** Rellena campos que en BD son NOT NULL o sensibles a null */
    private void aplicarDefaults(Paciente d) {
        if (isBlank(d.getEstadoPaciente()))
            d.setEstadoPaciente("Activo");
        d.setActivo(!"Inactivo".equalsIgnoreCase(d.getEstadoPaciente()));

        if (isBlank(d.getPais()))
            d.setPais("Colombia");
        if (isBlank(d.getEntidad()))
            d.setEntidad("PARTICULAR");
        if (isBlank(d.getTipoAseguramiento()))
            d.setTipoAseguramiento("Particular");
        if (isBlank(d.getTipoPaciente()))
            d.setTipoPaciente("Particular");
        if (isBlank(d.getVoluntadAnticipada()))
            d.setVoluntadAnticipada("No");
        if (isBlank(d.getOposicionDonacion()))
            d.setOposicionDonacion("No");

        if (isBlank(d.getAlergias()))
            d.setAlergias("Ninguna conocida");
        if (isBlank(d.getAntecedentesPersonales()))
            d.setAntecedentesPersonales("Ninguno");
        if (isBlank(d.getAntecedentesFamiliares()))
            d.setAntecedentesFamiliares("Ninguno");
        if (isBlank(d.getMedicamentosActuales()))
            d.setMedicamentosActuales("Ninguno");

        if (isBlank(d.getTelefono()))
            d.setTelefono(!isBlank(d.getCelular()) ? d.getCelular() : d.getTelefono1());
    }

    public List<Paciente> listar(String q) {
        if (q == null || q.isBlank())
            return pacienteRepo.findAllByOrderByPrimerApellidoAscPrimerNombreAsc();
        return pacienteRepo.search(q.trim());
    }

    public Paciente buscarPorId(UUID id) {
        return pacienteRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Paciente no encontrado"));
    }

    public Paciente buscarPorDocumento(String tipoDoc, String documento) {
        return pacienteRepo.findByTipoDocAndDocumento(tipoDoc, documento)
                .orElseThrow(() -> new RuntimeException(
                        "Paciente no encontrado: " + tipoDoc + " " + documento));
    }

    public PacienteBasicoDTO buscarBasicoPorDocumento(String tipoDoc, String documento) {
        if (isBlank(tipoDoc) || isBlank(documento))
            throw new RuntimeException("Tipo y número de documento son obligatorios");
        Paciente p = pacienteRepo
                .findByTipoDocAndDocumento(tipoDoc.trim(), documento.trim())
                .orElseThrow(() -> new RuntimeException("Paciente no encontrado"));
        return PacienteBasicoDTO.from(p);
    }

    @Transactional
    public Paciente crear(Paciente d, Authentication auth) {
        assertAdminOMedico(auth);

        if (isBlank(d.getTipoDoc()) || isBlank(d.getDocumento()))
            throw new RuntimeException("Tipo y número de documento son obligatorios");
        if (isBlank(d.getPrimerNombre()) || isBlank(d.getPrimerApellido()))
            throw new RuntimeException("Primer nombre y primer apellido son obligatorios");
        if (pacienteRepo.existsByTipoDocAndDocumento(d.getTipoDoc(), d.getDocumento()))
            throw new RuntimeException("Ya existe un paciente con ese documento");

        d.setId(null);
        d.setCreadoPor(auth.getName());
        d.setUsuarioIngreso(auth.getName());
        if (d.getFechaIngreso() == null)
            d.setFechaIngreso(LocalDate.now());

        aplicarDefaults(d);

        return pacienteRepo.save(d);
    }

    @Transactional
    public Paciente actualizar(UUID id, Paciente d, Authentication auth) {
        assertAdminOMedico(auth);
        Paciente p = buscarPorId(id);

        if (d.getTipoDoc() != null) p.setTipoDoc(d.getTipoDoc());
        if (d.getDocumento() != null) p.setDocumento(d.getDocumento());
        if (d.getPrimerNombre() != null) p.setPrimerNombre(d.getPrimerNombre());
        if (d.getSegundoNombre() != null) p.setSegundoNombre(d.getSegundoNombre());
        if (d.getPrimerApellido() != null) p.setPrimerApellido(d.getPrimerApellido());
        if (d.getSegundoApellido() != null) p.setSegundoApellido(d.getSegundoApellido());
        if (d.getNumeroCarnet() != null) p.setNumeroCarnet(d.getNumeroCarnet());
        if (d.getSexo() != null) p.setSexo(d.getSexo());
        if (d.getIdentidadGenero() != null) p.setIdentidadGenero(d.getIdentidadGenero());
        if (d.getEtnia() != null) p.setEtnia(d.getEtnia());
        if (d.getEstadoCivil() != null) p.setEstadoCivil(d.getEstadoCivil());
        if (d.getGrupoSanguineo() != null) p.setGrupoSanguineo(d.getGrupoSanguineo());
        p.setHabeasData(d.isHabeasData());
        if (d.getRaza() != null) p.setRaza(d.getRaza());
        if (d.getTipoDiscapacidad() != null) p.setTipoDiscapacidad(d.getTipoDiscapacidad());
        if (d.getReligion() != null) p.setReligion(d.getReligion());
        if (d.getFechaIngreso() != null) p.setFechaIngreso(d.getFechaIngreso());
        if (d.getEntidad() != null) p.setEntidad(d.getEntidad());
        if (d.getTipoAseguramiento() != null) p.setTipoAseguramiento(d.getTipoAseguramiento());
        if (d.getEps() != null) p.setEps(d.getEps());
        if (d.getTipoPaciente() != null) p.setTipoPaciente(d.getTipoPaciente());
        if (d.getTelefono1() != null) p.setTelefono1(d.getTelefono1());
        if (d.getExtension1() != null) p.setExtension1(d.getExtension1());
        if (d.getTelefono2() != null) p.setTelefono2(d.getTelefono2());
        if (d.getExtension2() != null) p.setExtension2(d.getExtension2());
        if (d.getCelular() != null) p.setCelular(d.getCelular());
        if (d.getTelefono() != null) p.setTelefono(d.getTelefono());
        if (d.getEmail() != null) p.setEmail(d.getEmail());
        if (d.getDireccion() != null) p.setDireccion(d.getDireccion());
        if (d.getPais() != null) p.setPais(d.getPais());
        if (d.getCodigoDepartamento() != null) p.setCodigoDepartamento(d.getCodigoDepartamento());
        if (d.getDepartamento() != null) p.setDepartamento(d.getDepartamento());
        if (d.getCodigoMunicipio() != null) p.setCodigoMunicipio(d.getCodigoMunicipio());
        if (d.getMunicipio() != null) p.setMunicipio(d.getMunicipio());
        if (d.getFechaNacimiento() != null) p.setFechaNacimiento(d.getFechaNacimiento());
        if (d.getHoraNacimiento() != null) p.setHoraNacimiento(d.getHoraNacimiento());
        if (d.getLugarNacimiento() != null) p.setLugarNacimiento(d.getLugarNacimiento());
        if (d.getEscolaridad() != null) p.setEscolaridad(d.getEscolaridad());
        if (d.getOcupacion() != null) p.setOcupacion(d.getOcupacion());
        if (d.getCodigoSiras() != null) p.setCodigoSiras(d.getCodigoSiras());
        if (d.getObservaciones() != null) p.setObservaciones(d.getObservaciones());
        if (d.getIdMedico() != null) p.setIdMedico(d.getIdMedico());
        if (d.getMedico() != null) p.setMedico(d.getMedico());
        if (d.getEstadoPaciente() != null) {
            p.setEstadoPaciente(d.getEstadoPaciente());
            p.setActivo(!"Inactivo".equalsIgnoreCase(d.getEstadoPaciente()));
        }
        if (d.getVoluntadAnticipada() != null) p.setVoluntadAnticipada(d.getVoluntadAnticipada());
        if (d.getFechaVoluntadAnticipada() != null) p.setFechaVoluntadAnticipada(d.getFechaVoluntadAnticipada());
        if (d.getCodigoPrestadorVoluntad() != null) p.setCodigoPrestadorVoluntad(d.getCodigoPrestadorVoluntad());
        if (d.getOposicionDonacion() != null) p.setOposicionDonacion(d.getOposicionDonacion());
        if (d.getFechaOposicionDonacion() != null) p.setFechaOposicionDonacion(d.getFechaOposicionDonacion());
        if (d.getAlergias() != null) p.setAlergias(d.getAlergias());
        if (d.getAntecedentesPersonales() != null) p.setAntecedentesPersonales(d.getAntecedentesPersonales());
        if (d.getAntecedentesFamiliares() != null) p.setAntecedentesFamiliares(d.getAntecedentesFamiliares());
        if (d.getMedicamentosActuales() != null) p.setMedicamentosActuales(d.getMedicamentosActuales());
        if (d.getContactoNombre() != null) p.setContactoNombre(d.getContactoNombre());
        if (d.getContactoParentesco() != null) p.setContactoParentesco(d.getContactoParentesco());
        if (d.getContactoTelefono() != null) p.setContactoTelefono(d.getContactoTelefono());

        if (isBlank(p.getTelefono()))
            p.setTelefono(!isBlank(p.getCelular()) ? p.getCelular() : p.getTelefono1());

        if (isBlank(p.getAlergias())) p.setAlergias("Ninguna conocida");
        if (isBlank(p.getAntecedentesPersonales())) p.setAntecedentesPersonales("Ninguno");
        if (isBlank(p.getAntecedentesFamiliares())) p.setAntecedentesFamiliares("Ninguno");
        if (isBlank(p.getMedicamentosActuales())) p.setMedicamentosActuales("Ninguno");

        return pacienteRepo.save(p);
    }

    @Transactional
    public Paciente desactivar(UUID id, Authentication auth) {
        assertAdminOMedico(auth);
        Paciente p = buscarPorId(id);
        p.setEstadoPaciente("Inactivo");
        p.setActivo(false);
        return pacienteRepo.save(p);
    }
}