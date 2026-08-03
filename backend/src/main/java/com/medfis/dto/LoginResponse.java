package com.medfis.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
@Data @AllArgsConstructor public class LoginResponse {
    private String token, id, nombre, email, rol;
    private boolean activo;
}
