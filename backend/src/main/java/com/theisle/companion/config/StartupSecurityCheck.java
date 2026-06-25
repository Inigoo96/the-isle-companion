package com.theisle.companion.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Falla el arranque si el backend esta usando el JWT_SECRET de desarrollo
 * (el valor por defecto commiteado). Asi produccion nunca puede firmar tokens
 * con una clave publica conocida en silencio: si Railway no tiene JWT_SECRET,
 * la app se niega a arrancar en vez de quedar vulnerable.
 *
 * Para desarrollo local: exporta APP_ALLOW_INSECURE_DEV_SECRET=true o, mejor,
 * pon tu propio JWT_SECRET.
 */
@Component
public class StartupSecurityCheck {

    private static final String DEV_JWT_SECRET =
            "dev-secret-change-in-production-must-be-256-bits";

    public StartupSecurityCheck(
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${app.allow-insecure-dev-secret:false}") boolean allowInsecureDevSecret) {

        if (DEV_JWT_SECRET.equals(jwtSecret) && !allowInsecureDevSecret) {
            throw new IllegalStateException(
                    "Refusing to start: JWT_SECRET is the built-in dev default. " +
                    "Set a strong, random JWT_SECRET environment variable (32+ chars). " +
                    "For local development only, set APP_ALLOW_INSECURE_DEV_SECRET=true.");
        }
    }
}
