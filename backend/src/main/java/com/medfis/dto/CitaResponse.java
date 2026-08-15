package com.medfis.dto;

import java.util.UUID;

public record CitaResponse(
        UUID id,
        UUID pacienteId,
        String pacienteNombre,
        String pacienteTipoDoc,
        String pacienteDocumento,
        String pacienteTelefono,
        String pacienteEmail,
        String fecha,
        String hora,
        String tipoCita,
        String tratamiento,
        String descripcion,
        String observaciones,
        String estado,
        String profesional,
        String creadoPor,
        String actualizadoPor,
        String observacionEstado
) {}