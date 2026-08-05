package com.medfis.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Map;
@Data public class ConsentimientoRequest {
    @NotBlank private String tipo;
    @NotBlank private String pacienteNombre;
    @NotBlank private String pacienteDoc;
    private String pacienteTel;
    private String emailPaciente;
    private String pdfUrl;
    @NotNull private Map<String, Object> datos;
}
