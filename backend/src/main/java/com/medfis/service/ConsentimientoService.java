package com.medfis.service;
import com.medfis.dto.ConsentimientoRequest;
import com.medfis.entity.Consentimiento;
import com.medfis.entity.Consentimiento.EstadoConsent;
import com.medfis.entity.Consentimiento.TipoConsent;
import com.medfis.entity.Notificacion;
import com.medfis.repository.ConsentimientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class ConsentimientoService {
    private final ConsentimientoRepository repo;
    private final NotificacionService notif;

    public List<Consentimiento> listarTodos() { return repo.findAllByOrderByCreatedAtDesc(); }
    public List<Consentimiento> pendientesMedico() { return repo.findByPendienteMedicoTrueAndEstadoOrderByCreatedAtDesc(EstadoConsent.FIRMADO); }
    public Consentimiento buscar(UUID id) { return repo.findById(id).orElseThrow(() -> new RuntimeException("No encontrado: "+id)); }
    public List<Consentimiento> buscar(String q) { return q==null||q.isBlank() ? repo.findAllByOrderByCreatedAtDesc() : repo.search(q); }

    @Transactional
    public Consentimiento crear(ConsentimientoRequest req, String creadoPor) {
        Consentimiento c = new Consentimiento();
        c.setTipo(TipoConsent.valueOf(req.getTipo())); c.setRadicado(genRadicado(req.getTipo()));
        c.setFecha(LocalDate.now()); c.setPacienteNombre(req.getPacienteNombre());
        c.setPacienteDoc(req.getPacienteDoc()); c.setPacienteTel(req.getPacienteTel());
        c.setEstado(EstadoConsent.FIRMADO); c.setPendienteMedico(true);
        c.setCreadoPor(creadoPor); c.setDatos(req.getDatos());
        Consentimiento saved = repo.save(c);
        String base = req.getPacienteNombre()+" · "+req.getTipo()+" · "+saved.getRadicado();
        notif.crearYEmitir(Notificacion.TipoNotif.NUEVO_CONSENTIMIENTO, "Consentimiento pendiente de Visto Bueno", base+". Revise y apruebe.", saved.getId(), "MEDICO");
        notif.crearYEmitir(Notificacion.TipoNotif.NUEVO_CONSENTIMIENTO, "Nuevo consentimiento — "+req.getPacienteNombre(), "Por: "+creadoPor+" · "+saved.getRadicado()+" · Pendiente aprobación médica.", saved.getId(), "ADMINISTRADOR");
        return saved;
    }

    @Transactional
    public Consentimiento aprobar(UUID id, String medico) {
        Consentimiento c = buscar(id);
        if (c.getEstado() != EstadoConsent.FIRMADO) throw new RuntimeException("No está en estado FIRMADO");
        c.setEstado(EstadoConsent.APROBADO); c.setPendienteMedico(false);
        c.setAprobadoPor(medico); c.setFechaAprobacion(LocalDate.now());
        Consentimiento saved = repo.save(c);
        notif.crearYEmitir(Notificacion.TipoNotif.APROBADO, "Visto Bueno — Cita habilitada", c.getPacienteNombre()+" — "+c.getRadicado()+" aprobado por "+medico, saved.getId(), "TODOS");
        return saved;
    }

    @Transactional
    public Consentimiento rechazar(UUID id, String motivo, String medico) {
        Consentimiento c = buscar(id);
        c.setEstado(EstadoConsent.RECHAZADO); c.setPendienteMedico(false);
        c.setMotivoRechazo(motivo); c.setAprobadoPor(medico);
        Consentimiento saved = repo.save(c);
        notif.crearYEmitir(Notificacion.TipoNotif.RECHAZADO, "Consentimiento rechazado", c.getPacienteNombre()+" — "+c.getRadicado()+". Motivo: "+motivo, saved.getId(), "TODOS");
        return saved;
    }

    @Transactional
    public Consentimiento anular(UUID id) {
        Consentimiento c = buscar(id); c.setEstado(EstadoConsent.ANULADO); c.setPendienteMedico(false);
        return repo.save(c);
    }

    @Transactional
    public void marcarEmailEnviado(UUID id, String emailPaciente) {
        Consentimiento c = buscar(id);
        c.setEmailEnviado(true);
        if (emailPaciente != null && !emailPaciente.isBlank()) c.setEmailPaciente(emailPaciente);
        repo.save(c);
    }

    public long countHoy()       { return repo.countByFecha(LocalDate.now()); }
    public long countAprobados() { return repo.countByEstado(EstadoConsent.APROBADO); }
    public long countFirmados()  { return repo.countByEstado(EstadoConsent.FIRMADO); }
    public long countTotal()     { return repo.count(); }

    private String genRadicado(String tipo) {
        String p = switch(tipo) { case "escleroterapia"->"ESC"; case "sueroterapia"->"SUE"; case "laser"->"LAS"; default->"PAQ"; };
        return p+"-"+LocalDate.now().getYear()+"-"+String.format("%04d", repo.count()+1);
    }
}
