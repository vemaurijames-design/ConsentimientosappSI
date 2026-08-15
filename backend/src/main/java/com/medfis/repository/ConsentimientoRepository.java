package com.medfis.repository;
import com.medfis.entity.Consentimiento;
import com.medfis.entity.Consentimiento.EstadoConsent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ConsentimientoRepository extends JpaRepository<Consentimiento, UUID> {
    List<Consentimiento> findAllByOrderByCreatedAtDesc();
    List<Consentimiento> findByPendienteMedicoTrueAndEstadoOrderByCreatedAtDesc(EstadoConsent estado);

    @Query("SELECT c FROM Consentimiento c WHERE LOWER(c.pacienteNombre) LIKE LOWER(CONCAT('%',:q,'%')) OR c.pacienteDoc LIKE CONCAT('%',:q,'%') OR c.radicado LIKE CONCAT('%',:q,'%') ORDER BY c.createdAt DESC")
    List<Consentimiento> search(String q);
    long countByFecha(LocalDate fecha);
    long countByEstado(EstadoConsent estado);
    @Query("SELECT COUNT(c) FROM Consentimiento c WHERE c.tipo = :tipo AND YEAR(c.fecha) = :year")
    long countByTipoAndYear(Consentimiento.TipoConsent tipo, int year);
    //opcional agregado
    List<Consentimiento> findByUsuarioId(UUID usuarioId);
}
