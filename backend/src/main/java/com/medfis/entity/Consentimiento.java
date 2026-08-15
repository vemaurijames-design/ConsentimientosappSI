package com.medfis.entity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "consentimientos")
@Data
@NoArgsConstructor
public class Consentimiento {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 50) private TipoConsent tipo;
    @Column(nullable = false, unique = true, length = 30) private String radicado;
    @Column(nullable = false) private LocalDate fecha;
    @Column(name = "paciente_nombre", nullable = false, length = 200) private String pacienteNombre;
    @Column(name = "paciente_doc", nullable = false, length = 50) private String pacienteDoc;
    @Column(name = "paciente_tel", length = 30) private String pacienteTel;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private EstadoConsent estado = EstadoConsent.FIRMADO;
    @Column(name = "pendiente_medico", nullable = false) private boolean pendienteMedico = true;
    @Column(name = "motivo_rechazo") private String motivoRechazo;
    @Column(name = "aprobado_por", length = 200) private String aprobadoPor;
    @Column(name = "fecha_aprobacion") private LocalDate fechaAprobacion;
    @Column(name = "creado_por", length = 200) private String creadoPor;
    @Column(name = "email_paciente", length = 200) private String emailPaciente;
    @Column(name = "pdf_url", length = 1000) private String pdfUrl;
    @Column(name = "email_enviado", nullable = false) private boolean emailEnviado = false;
    @Column(name = "whatsapp_enviado", nullable = false) private boolean whatsappEnviado = false;
    @Column(name = "pdf_nombre", length = 200)              private String pdfNombre;
    @Column(name = "pdf_base64", columnDefinition = "text") private String pdfBase64;
    @Column(name = "fecha_email")                           private LocalDateTime fechaEmail;
    @Column(name = "email_error", length = 1000)            private String emailError;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb", nullable = false) private Map<String, Object> datos;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
    // Relación con la entidad Usuario (opcional)
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = true)
    private Usuario usuario;
    public enum TipoConsent { escleroterapia, sueroterapia, laser, paquete }
    public enum EstadoConsent { FIRMADO, PENDIENTE, APROBADO, RECHAZADO, ANULADO }
}
