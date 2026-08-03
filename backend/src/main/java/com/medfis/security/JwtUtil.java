package com.medfis.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {
    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.expiration}") private long expiration;

    private Key key() { return Keys.hmacShaKeyFor(secret.getBytes()); }

    public String generateToken(UserDetails ud, String rol) {
        Map<String,Object> c = new HashMap<>(); c.put("rol", rol);
        return Jwts.builder().setClaims(c).setSubject(ud.getUsername())
            .setIssuedAt(new Date()).setExpiration(new Date(System.currentTimeMillis()+expiration))
            .signWith(key(), SignatureAlgorithm.HS256).compact();
    }
    public String extractUsername(String t) {
        return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(t).getBody().getSubject();
    }
    public boolean validateToken(String t, UserDetails ud) {
        try {
            String u = extractUsername(t);
            Date exp = Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(t).getBody().getExpiration();
            return u.equals(ud.getUsername()) && exp.after(new Date());
        } catch (JwtException e) { return false; }
    }
}
