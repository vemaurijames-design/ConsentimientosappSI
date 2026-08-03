package com.medfis.entity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notificaciones")
@Data
@NoArgsConstructor
public class Notificacion {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 50) private TipoNotif tipo;
    @Column(nullable = false, length = 300) private String titulo;
    @Column(nullable = false) private String mensaje;
    @Column(name = "consent_id") private UUID consentId;
    @Column(nullable = false) private boolean leida = false;
    @CreationTimestamp @Column(nullable = false, updatable = false) private LocalDateTime fecha;
    @Column(name = "para_rol", nullable = false, length = 50) private String paraRol = "TODOS";
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "para_user_id") private Usuario paraUser;
    public enum TipoNotif { NUEVO_CONSENTIMIENTO, APROBADO, RECHAZADO, SISTEMA }
}
