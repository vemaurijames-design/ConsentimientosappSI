CREATE TABLE IF NOT EXISTS usuarios (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(200) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    rol         VARCHAR(50)  NOT NULL,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS consentimientos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo                VARCHAR(50)  NOT NULL,
    radicado            VARCHAR(30)  NOT NULL UNIQUE,
    fecha               DATE         NOT NULL,
    paciente_nombre     VARCHAR(200) NOT NULL,
    paciente_doc        VARCHAR(50)  NOT NULL,
    paciente_tel        VARCHAR(30),
    estado              VARCHAR(30)  NOT NULL DEFAULT 'FIRMADO',
    pendiente_medico    BOOLEAN NOT NULL DEFAULT TRUE,
    motivo_rechazo      TEXT,
    aprobado_por        VARCHAR(200),
    fecha_aprobacion    DATE,
    creado_por          VARCHAR(200),
    datos               JSONB        NOT NULL DEFAULT '{}',
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notificaciones (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo         VARCHAR(50)  NOT NULL,
    titulo       VARCHAR(300) NOT NULL,
    mensaje      TEXT         NOT NULL,
    consent_id   UUID,
    leida        BOOLEAN NOT NULL DEFAULT FALSE,
    fecha        TIMESTAMP    NOT NULL DEFAULT NOW(),
    para_rol     VARCHAR(50)  NOT NULL DEFAULT 'TODOS',
    para_user_id UUID
);
