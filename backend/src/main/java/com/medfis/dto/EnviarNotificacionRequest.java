package com.medfis.dto;

import lombok.Data;

@Data
public class EnviarNotificacionRequest {
    private String emailPaciente;
    private String pdfBase64;
    private boolean enviarWhatsapp;
}
