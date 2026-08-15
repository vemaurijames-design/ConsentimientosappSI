package com.medfis.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UsuarioRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    @Email
    private String email;

    private String password;

    @NotBlank
    private String rol;

    /** Opcional: permiso para editar historia clínica */
    private Boolean puedeEditarHc;
}