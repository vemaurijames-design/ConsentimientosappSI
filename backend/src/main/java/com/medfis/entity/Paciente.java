package com.medfis.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "pacientes")
@Data
@NoArgsConstructor
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ips_id")
    private UUID ipsId;

    @Column(name = "tipo_doc", nullable = false, length = 10)
    private String tipoDoc;

    @Column(nullable = false, length = 30)
    private String documento;

    @Column(name = "primer_nombre", nullable = false, length = 80)
    private String primerNombre;

    @Column(name = "segundo_nombre", length = 80)
    private String segundoNombre;

    @Column(name = "primer_apellido", nullable = false, length = 80)
    private String primerApellido;

    @Column(name = "segundo_apellido", length = 80)
    private String segundoApellido;

    @Column(name = "numero_carnet", length = 50)
    private String numeroCarnet;

    @Column(length = 5)
    private String sexo;

    @Column(name = "identidad_genero", length = 50)
    private String identidadGenero;

    @Column(length = 80)
    private String etnia;

    @Column(name = "estado_civil", length = 40)
    private String estadoCivil;

    @Column(name = "grupo_sanguineo", length = 10)
    private String grupoSanguineo;

    @Column(name = "habeas_data", nullable = false)
    private boolean habeasData = false;

    @Column(length = 50)
    private String raza;

    @Column(name = "tipo_discapacidad", length = 100)
    private String tipoDiscapacidad;

    @Column(length = 80)
    private String religion;

    @Column(name = "fecha_ingreso")
    private LocalDate fechaIngreso;

    @Column(name = "id_usuario_ingreso", length = 50)
    private String idUsuarioIngreso;

    @Column(name = "usuario_ingreso", length = 150)
    private String usuarioIngreso;

    @Column(length = 100)
    private String entidad;

    @Column(name = "tipo_aseguramiento", length = 80)
    private String tipoAseguramiento;

    @Column(length = 120)
    private String eps;

    @Column(name = "tipo_paciente", length = 80)
    private String tipoPaciente;

    @Column(name = "telefono1", length = 30)
    private String telefono1;

    @Column(name = "extension1", length = 10)
    private String extension1;

    @Column(name = "telefono2", length = 30)
    private String telefono2;

    @Column(name = "extension2", length = 10)
    private String extension2;

    @Column(length = 30)
    private String celular;

    @Column(length = 30)
    private String telefono;

    @Column(length = 150)
    private String email;

    @Column(length = 250)
    private String direccion;

    @Column(length = 80)
    private String pais = "Colombia";

    @Column(name = "codigo_departamento", length = 10)
    private String codigoDepartamento;

    @Column(length = 80)
    private String departamento;

    @Column(name = "codigo_municipio", length = 10)
    private String codigoMunicipio;

    @Column(length = 80)
    private String municipio;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "hora_nacimiento")
    private LocalTime horaNacimiento;

    @Column(name = "lugar_nacimiento", length = 120)
    private String lugarNacimiento;

    @Column(length = 80)
    private String escolaridad;

    @Column(length = 120)
    private String ocupacion;

    @Column(name = "codigo_siras", length = 50)
    private String codigoSiras;

    @Column(length = 1000)
    private String observaciones;

    @Column(name = "id_medico", length = 50)
    private String idMedico;

    @Column(length = 150)
    private String medico;

    @Column(name = "estado_paciente", nullable = false, length = 20)
    private String estadoPaciente = "Activo";

    @Column(name = "voluntad_anticipada", length = 10)
    private String voluntadAnticipada;

    @Column(name = "fecha_voluntad_anticipada")
    private LocalDate fechaVoluntadAnticipada;

    @Column(name = "codigo_prestador_voluntad", length = 50)
    private String codigoPrestadorVoluntad;

    @Column(name = "oposicion_donacion", length = 10)
    private String oposicionDonacion;

    @Column(name = "fecha_oposicion_donacion")
    private LocalDate fechaOposicionDonacion;

    @Column(length = 500)
    private String alergias = "Ninguna conocida";

    @Column(name = "antecedentes_personales", length = 1000)
    private String antecedentesPersonales = "Ninguno";

    @Column(name = "antecedentes_familiares", length = 1000)
    private String antecedentesFamiliares = "Ninguno";

    @Column(name = "medicamentos_actuales", length = 1000)
    private String medicamentosActuales = "Ninguno";

    @Column(name = "contacto_nombre", length = 150)
    private String contactoNombre;

    @Column(name = "contacto_parentesco", length = 50)
    private String contactoParentesco;

    @Column(name = "contacto_telefono", length = 30)
    private String contactoTelefono;

    @Column(name = "creado_por", length = 150)
    private String creadoPor;

    @Column(nullable = false)
    private boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Se ejecuta justo antes del INSERT — evita NULL en columnas críticas */
    @PrePersist
    public void prePersist() {
        if (estadoPaciente == null || estadoPaciente.isBlank()) {
            estadoPaciente = "Activo";
        }
        activo = !"Inactivo".equalsIgnoreCase(estadoPaciente);

        if (alergias == null || alergias.isBlank()) {
            alergias = "Ninguna conocida";
        }
        if (antecedentesPersonales == null || antecedentesPersonales.isBlank()) {
            antecedentesPersonales = "Ninguno";
        }
        if (antecedentesFamiliares == null || antecedentesFamiliares.isBlank()) {
            antecedentesFamiliares = "Ninguno";
        }
        if (medicamentosActuales == null || medicamentosActuales.isBlank()) {
            medicamentosActuales = "Ninguno";
        }
        if (pais == null || pais.isBlank()) {
            pais = "Colombia";
        }
        if (voluntadAnticipada == null || voluntadAnticipada.isBlank()) {
            voluntadAnticipada = "No";
        }
        if (oposicionDonacion == null || oposicionDonacion.isBlank()) {
            oposicionDonacion = "No";
        }
        if (fechaIngreso == null) {
            fechaIngreso = LocalDate.now();
        }
    }
}