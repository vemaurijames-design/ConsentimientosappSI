package com.medfis.dto;

import com.medfis.entity.Paciente;
import java.util.UUID;

public record PacienteBasicoDTO(
        UUID id,
        String tipoDoc,
        String documento,
        String primerNombre,
        String segundoNombre,
        String primerApellido,
        String segundoApellido,
        String celular,
        String telefono,
        String email,
        String direccion,
        String municipio,
        String departamento,
        String fechaNacimiento,
        String eps,
        String estadoPaciente
) {
    public static PacienteBasicoDTO from(Paciente p) {
        return new PacienteBasicoDTO(
                p.getId(),
                p.getTipoDoc(),
                p.getDocumento(),
                p.getPrimerNombre(),
                p.getSegundoNombre(),
                p.getPrimerApellido(),
                p.getSegundoApellido(),
                p.getCelular(),
                p.getTelefono(),
                p.getEmail(),
                p.getDireccion(),
                p.getMunicipio(),
                p.getDepartamento(),
                p.getFechaNacimiento() != null ? p.getFechaNacimiento().toString() : null,
                p.getEps(),
                p.getEstadoPaciente()
        );
    }
}