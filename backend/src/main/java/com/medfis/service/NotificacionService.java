package com.medfis.service;
import com.medfis.entity.Notificacion;
import com.medfis.entity.Usuario;
import com.medfis.repository.NotificacionRepository;
import com.medfis.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class NotificacionService {
    private final NotificacionRepository repo;
    private final UsuarioRepository uRepo;
    private final SimpMessagingTemplate ws;

    public List<Notificacion> getParaUsuario(String email) {
        Usuario u = uRepo.findByEmail(email).orElse(null);
        if (u == null) return List.of();
        return repo.findForUser(u.getRol().name(), u);
    }

    public long countNoLeidas(String email) {
        Usuario u = uRepo.findByEmail(email).orElse(null);
        if (u == null) return 0;
        return repo.findUnreadForUser(u.getRol().name(), u).size();
    }

    @Transactional
    public Notificacion marcarLeida(UUID id) {
        Notificacion n = repo.findById(id).orElseThrow(() -> new RuntimeException("No encontrada"));
        n.setLeida(true); return repo.save(n);
    }

    @Transactional
    public int marcarTodasLeidas(String email) {
        Usuario u = uRepo.findByEmail(email).orElse(null);
        if (u == null) return 0;
        return repo.markAllReadForUser(u.getRol().name(), u);
    }

    @Transactional
    public void eliminar(UUID id) { repo.deleteById(id); }

    @Transactional
    public Notificacion crearYEmitir(Notificacion.TipoNotif tipo, String titulo, String mensaje, UUID consentId, String paraRol) {
        Notificacion n = new Notificacion();
        n.setTipo(tipo); n.setTitulo(titulo); n.setMensaje(mensaje);
        n.setConsentId(consentId); n.setParaRol(paraRol);
        Notificacion saved = repo.save(n);
        String topic = "TODOS".equals(paraRol) ? "/topic/notificaciones/todos" : "/topic/notificaciones/"+paraRol.toLowerCase();
        ws.convertAndSend(topic, saved);
        return saved;
    }
}
