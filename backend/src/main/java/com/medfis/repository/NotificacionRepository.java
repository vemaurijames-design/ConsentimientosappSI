package com.medfis.repository;
import com.medfis.entity.Notificacion;
import com.medfis.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, UUID> {
    @Query("SELECT n FROM Notificacion n WHERE n.paraRol='TODOS' OR n.paraRol=:rol OR n.paraUser=:user ORDER BY n.fecha DESC")
    List<Notificacion> findForUser(String rol, Usuario user);
    @Query("SELECT n FROM Notificacion n WHERE (n.paraRol='TODOS' OR n.paraRol=:rol OR n.paraUser=:user) AND n.leida=FALSE ORDER BY n.fecha DESC")
    List<Notificacion> findUnreadForUser(String rol, Usuario user);
    @Modifying
    @Query("UPDATE Notificacion n SET n.leida=TRUE WHERE n.paraRol='TODOS' OR n.paraRol=:rol OR n.paraUser=:user")
    int markAllReadForUser(String rol, Usuario user);
}
